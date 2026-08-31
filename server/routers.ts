import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sdk } from "./_core/sdk";
import {
  adminProcedure,
  managerProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sendRentalWhatsAppNotification } from "./twilio";
import {
  hashManagerPassword,
  verifyManagerPassword,
} from "./_core/managerAuth";
import {
  buildLocalAuthenticatedUser,
  resolveLocalLoginProfile,
} from "./_core/localAuth";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async opts => {
      if (!opts.ctx.user) return null;
      if (opts.ctx.user.role === "manager") {
        return {
          ...opts.ctx.user,
          categoryIds: await db.getManagerCategoryIds(opts.ctx.user.id),
        };
      }
      return opts.ctx.user;
    }),
    localLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existingUser = await db.getUserByEmail(
          input.email.trim().toLowerCase()
        );
        const profile = resolveLocalLoginProfile(
          {
            email: input.email,
            name: input.name,
            phone: input.phone,
            address: input.address,
          },
          Boolean(existingUser),
          existingUser
        );

        let user: Awaited<ReturnType<typeof db.getUserByEmail>> | null = null;

        if (existingUser) {
          user = await db.updateUserById(existingUser.id, {
            openId: profile.openId,
            name: profile.name,
            email: profile.email,
            phone: profile.phone ?? existingUser.phone ?? null,
            address: profile.address ?? existingUser.address ?? null,
            loginMethod: "email",
            lastSignedIn: new Date(),
          });
        } else {
          try {
            await db.upsertUser({
              openId: profile.openId,
              name: profile.name,
              email: profile.email,
              phone: profile.phone ?? null,
              address: profile.address ?? null,
              loginMethod: "email",
              lastSignedIn: new Date(),
            });
            user =
              (await db.getUserByOpenId(profile.openId)) ??
              (await db.getUserByEmail(profile.email));
          } catch (error) {
            console.warn("[Auth] Falling back to local session user:", error);
          }
        }

        if (!user) {
          throw new Error(
            "فشل تسجيل الدخول المحلي: لم يتم حفظ المستخدم في قاعدة البيانات."
          );
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "User",
          expiresInMs: ONE_YEAR_MS,
        });

        if (user.id > 0) {
          await db.updateUserById(user.id, { token: sessionToken });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          user,
          sessionToken,
        };
      }),
    managerLogin: publicProcedure
      .input(
        z.object({ username: z.string().min(3), password: z.string().min(1) })
      )
      .mutation(async ({ ctx, input }) => {
        const manager = await db.getUserByUsername(input.username);
        if (
          !manager ||
          (manager.role !== "admin" && manager.role !== "manager") ||
          !verifyManagerPassword(input.password, manager.passwordHash)
        ) {
          throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
        const sessionToken = await sdk.createSessionToken(manager.openId, {
          name: manager.name || manager.username || "مدير",
          expiresInMs: ONE_YEAR_MS,
        });
        await db.updateUserById(manager.id, {
          token: sessionToken,
          lastSignedIn: new Date(),
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { user: manager, sessionToken };
      }),
    checkEmail: publicProcedure
      .input(z.string().email())
      .query(async ({ input }) => {
        const existingUser = await db.getUserByEmail(
          input.trim().toLowerCase()
        );
        return {
          exists: Boolean(existingUser),
          name: existingUser?.name ?? null,
          phone: existingUser?.phone ?? null,
          address: existingUser?.address ?? null,
        };
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) {
        await db.clearCart(ctx.user.id);
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  products: router({
    list: publicProcedure.query(() => db.getProducts(12)),
    byId: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getProductById(input)),
    byCategory: publicProcedure
      .input(z.string())
      .query(({ input }) => db.getProductsByCategory(input)),
    search: publicProcedure
      .input(
        z.object({
          query: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          minRating: z.number().optional(),
          categories: z.array(z.string()).optional(),
          brands: z.array(z.string()).optional(),
          colors: z.array(z.string()).optional(),
          sizes: z.array(z.string()).optional(),
          limit: z.number().default(20),
        })
      )
      .query(({ input }) => db.searchProducts(input)),
    categories: publicProcedure.query(() => db.getCategories()),
    categoriesWithImages: publicProcedure.query(() =>
      db.getActiveCategoriesWithImages()
    ),
    brands: publicProcedure.query(() => db.getBrands()),
    sections: publicProcedure.query(() => db.getBrandSectionsWithCategories()),
    colors: publicProcedure.query(() => db.getProductColors()),
    sizes: publicProcedure.query(() => db.getProductSizes()),
  }),

  cart: router({
    list: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.getCartItems(ctx.user.id);
    }),
    add: publicProcedure
      .input(
        z.object({ productId: z.number(), quantity: z.number().default(1) })
      )
      .mutation(({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        return db.addToCart(ctx.user.id, input.productId, input.quantity);
      }),
    remove: publicProcedure.input(z.number()).mutation(({ ctx, input }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.removeFromCart(ctx.user.id, input);
    }),
    setRentalDate: publicProcedure
      .input(
        z.object({ productId: z.number(), rentalDate: z.string().nullable() })
      )
      .mutation(({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        return db.setCartItemRentalDate(
          ctx.user.id,
          input.productId,
          input.rentalDate
        );
      }),
    updateQuantity: publicProcedure
      .input(z.object({ productId: z.number(), quantity: z.number() }))
      .mutation(({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        return db.updateCartItemQuantity(
          ctx.user.id,
          input.productId,
          input.quantity
        );
      }),
    clear: publicProcedure.mutation(({ ctx }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.clearCart(ctx.user.id);
    }),
    checkout: publicProcedure
      .input(
        z.object({
          paymentMethod: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        const user = ctx.user;
        return db.createOrderFromCart(
          user.id,
          input.paymentMethod,
          user.name || null,
          user.phone || null,
          user.address || null
        );
      }),
    orders: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.getOrdersByUser(ctx.user.id);
    }),
    updateStatus: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum([
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        return db.updateOrderStatus(ctx.user.id, input.orderId, input.status);
      }),
    updateItems: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          paymentMethod: z.string().optional(),
          shippingAddress: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number().min(1),
              price: z.number().min(0),
              title: z.string().optional(),
              image: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        return db.updateOrderItems(
          ctx.user.id,
          input.orderId,
          input.items,
          input.paymentMethod,
          input.shippingAddress ?? null
        );
      }),
  }),

  rentals: router({
    request: publicProcedure
      .input(z.object({ productId: z.number(), rentalDate: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        const result = await db.createRentalRequest(
          ctx.user.id,
          input.productId,
          input.rentalDate
        );
        void sendRentalWhatsAppNotification({
          phone: ctx.user.phone,
          event: result.available ? "requested" : "unavailable",
          productName: result.request?.productName,
          rentalDate: input.rentalDate,
        }).catch(error =>
          console.warn("[Twilio] Rental request notification failed", error)
        );
        return result;
      }),
    myRequests: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.getRentalRequestsByUser(ctx.user.id);
    }),
  }),
  wishlist: router({
    list: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.getWishlistItems(ctx.user.id);
    }),
    add: publicProcedure.input(z.number()).mutation(({ ctx, input }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.addToWishlist(ctx.user.id, input);
    }),
    remove: publicProcedure.input(z.number()).mutation(({ ctx, input }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.removeFromWishlist(ctx.user.id, input);
    }),
    isInWishlist: publicProcedure.input(z.number()).query(({ ctx, input }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.isInWishlist(ctx.user.id, input);
    }),
  }),

  reviews: router({
    byProduct: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getProductReviews(input)),
    byUser: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new Error("Authentication required");
      return db.getUserReviews(ctx.user.id);
    }),
    create: publicProcedure
      .input(
        z.object({
          productId: z.number(),
          rating: z.number().min(1).max(5),
          title: z.string(),
          comment: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (!ctx.user) throw new Error("Authentication required");
        return db.createReview(
          ctx.user.id,
          input.productId,
          input.rating,
          input.title,
          input.comment
        );
      }),
    update: publicProcedure
      .input(
        z.object({
          reviewId: z.number(),
          rating: z.number().min(1).max(5),
          title: z.string(),
          comment: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.updateReview(
          input.reviewId,
          input.rating,
          input.title,
          input.comment
        )
      ),
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => db.deleteReview(input)),
    markHelpful: publicProcedure
      .input(z.number())
      .mutation(({ input }) => db.markReviewAsHelpful(input)),
  }),

  dashboard: router({
    stats: managerProcedure.query(({ ctx }) =>
      db.getDashboardStatsForUser(ctx.user.id, ctx.user.role === "admin")
    ),
    orders: router({
      list: managerProcedure.query(({ ctx }) =>
        db.getOrdersForManager(ctx.user.id, ctx.user.role === "admin")
      ),
      updateStatus: managerProcedure
        .input(
          z.object({
            orderId: z.number(),
            status: z.enum([
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ]),
            estimatedDeliveryMinutes: z
              .number()
              .int()
              .min(0)
              .nullable()
              .optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const allowedOrders = await db.getOrdersForManager(
            ctx.user.id,
            false
          );
          if (!allowedOrders.some(order => order.id === input.orderId)) {
            throw new Error("لا تملك صلاحية إدارة هذا الطلب");
          }
          return db.updateOrderStatusAdmin(
            input.orderId,
            input.status,
            input.estimatedDeliveryMinutes
          );
        }),
    }),
    rentals: router({
      requests: router({
        list: managerProcedure.query(({ ctx }) =>
          db.getRentalRequestsForManager(ctx.user.id, ctx.user.role === "admin")
        ),
        approve: managerProcedure
          .input(
            z.object({
              requestId: z.number(),
              payments: z.string(),
              notifyWhatsApp: z.boolean().default(false),
            })
          )
          .mutation(async ({ ctx, input }) => {
            const allowedRequests = await db.getRentalRequestsForManager(
              ctx.user.id,
              false
            );
            if (!allowedRequests.some(request => request.id === input.requestId)) {
              throw new Error("لا تملك صلاحية إدارة هذا الطلب");
            }
            const result = await db.approveRentalRequest(
              input.requestId,
              input.payments
            );
            if (result && input.notifyWhatsApp) {
              const user = await db.getUserById(result.userId);
              void sendRentalWhatsAppNotification({
                phone: user?.phone,
                event: "approved",
                productName: result.productName,
                productImage: result.productImage,
                rentalDate: result.rentalDate,
                rentalPrice: result.booking?.rentalPrice,
                payments: result.booking?.payments,
                remaining: result.booking?.remaining,
              }).catch(error =>
                console.warn(
                  "[Twilio] Rental approval notification failed",
                  error
                )
              );
            }
            return result;
          }),
        reject: managerProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
          const allowedRequests = await db.getRentalRequestsForManager(
            ctx.user.id,
            false
          );
          if (!allowedRequests.some(request => request.id === input)) {
            throw new Error("لا تملك صلاحية إدارة هذا الطلب");
          }
          const result = await db.rejectRentalRequest(input);
          if (result) {
            const user = await db.getUserById(result.userId);
            void sendRentalWhatsAppNotification({
              phone: user?.phone,
              event: "unavailable",
              productName: result.productName,
              rentalDate: result.rentalDate,
            }).catch(error =>
              console.warn(
                "[Twilio] Rental rejection notification failed",
                error
              )
            );
          }
          return result;
        }),
      }),
      bookings: router({
        list: managerProcedure.query(({ ctx }) =>
          db.getRentalBookingsForManager(ctx.user.id, ctx.user.role === "admin")
        ),
        updatePayments: managerProcedure
          .input(z.object({ bookingId: z.number(), payments: z.string() }))
          .mutation(async ({ ctx, input }) => {
            const allowedBookings = await db.getRentalBookingsForManager(
              ctx.user.id,
              false
            );
            if (!allowedBookings.some(booking => booking.id === input.bookingId)) {
              throw new Error("لا تملك صلاحية إدارة هذا الحجز");
            }
            return db.updateRentalBookingPayments(input.bookingId, input.payments);
          }),
        return: managerProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
          const allowedBookings = await db.getRentalBookingsForManager(
            ctx.user.id,
            false
          );
          if (!allowedBookings.some(booking => booking.id === input)) {
            throw new Error("لا تملك صلاحية إدارة هذا الحجز");
          }
          const booking = await db.returnRentalBooking(input);
          const user = await db.getUserById(booking.userId);
          const product = await db.getProductById(booking.productId);
          void sendRentalWhatsAppNotification({
            phone: user?.phone,
            event: "returned",
            productName: product?.name,
            rentalDate: booking.rentalDate,
          }).catch(error =>
            console.warn("[Twilio] Rental return notification failed", error)
          );
          return booking;
        }),
      }),
    }),
    products: router({
      list: managerProcedure.query(({ ctx }) =>
        db.getProductsForManager(ctx.user.id, ctx.user.role === "admin")
      ),
      create: managerProcedure
        .input(
          z.object({
            name: z.string(),
            brand: z.string(),
            category: z.string(),
            categoryId: z.number(),
            brandId: z.number(),
            description: z.string().optional(),
            price: z.string(),
            oldPrice: z.string().optional(),
            image: z.string().optional(),
            images: z.array(z.string()).optional(),
            stock: z.number().default(0),
            isOnSale: z.boolean().optional(),
            badge: z.string().optional(),
            badgeColor: z.string().optional(),
            color: z.string().optional(),
            size: z.string().optional(),
            isRentable: z.boolean().optional(),
            isSellable: z.boolean().optional(),
            purchasePrice: z.string().optional(),
            rentalPrice: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await db.assertManagerCategoryAccess(ctx.user.id, input.categoryId);
          const product = await db.createProductAdmin(input);
          if (
            product &&
            input.stock > 0 &&
            input.purchasePrice &&
            Number(input.purchasePrice) > 0
          ) {
            await db.recordPurchase({
              managerId: ctx.user.id,
              categoryId: input.categoryId,
              productId: product.id,
              productName: product.name,
              quantity: input.stock,
              unitCost: Number(input.purchasePrice),
            });
          }
          return product;
        }),
      update: managerProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            brand: z.string().optional(),
            price: z.string().optional(),
            oldPrice: z.string().optional(),
            description: z.string().optional(),
            category: z.string().optional(),
            categoryId: z.number().nullable().optional(),
            brandId: z.number().nullable().optional(),
            stock: z.number().optional(),
            isOnSale: z.boolean().optional(),
            image: z.string().optional(),
            images: z.array(z.string()).optional(),
            badge: z.string().optional(),
            badgeColor: z.string().optional(),
            color: z.string().optional(),
            size: z.string().optional(),
            isRentable: z.boolean().optional(),
            isSellable: z.boolean().optional(),
            purchasePrice: z.string().optional(),
            rentalPrice: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const existing = await db.getProductById(input.id);
          if (!existing) throw new Error("المنتج غير موجود");
          await db.assertManagerCategoryAccess(ctx.user.id, existing.categoryId);
          return db.updateProductAdmin(input.id, input);
        }),
      delete: managerProcedure
        .input(z.number())
        .mutation(async ({ ctx, input }) => {
          const existing = await db.getProductById(input);
          if (!existing) throw new Error("المنتج غير موجود");
          await db.assertManagerCategoryAccess(ctx.user.id, existing.categoryId);
          return db.deleteProductAdmin(input);
        }),
    }),
    categories: router({
      list: managerProcedure.query(({ ctx }) =>
        db.getCategoriesForManager(ctx.user.id, ctx.user.role === "admin")
      ),
      create: managerProcedure
        .input(
          z.object({
            name: z.string(),
            categoryCode: z
              .string()
              .regex(/^[A-Za-z0-9-]+$/)
              .optional(),
            slug: z.string().optional(),
            description: z.string().optional(),
            image: z.string().optional(),
            sectionId: z.number().int().positive().nullable().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await db.assertManagerCategorySectionAccess(
            ctx.user.id,
            input.sectionId
          );
          return db.createCategoryAdmin(input);
        }),
      update: managerProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            categoryCode: z
              .string()
              .regex(/^[A-Za-z0-9-]+$/)
              .optional(),
            slug: z.string().optional(),
            description: z.string().optional(),
            image: z.string().optional(),
            sectionId: z.number().int().positive().nullable().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const existing = (await db.getAllCategories()).find(
            item => item.id === input.id
          );
          await db.assertManagerCategoryAccess(ctx.user.id, existing?.id);
          if (ctx.user.role !== "admin" && input.sectionId !== undefined) {
            await db.assertManagerCategorySectionAccess(
              ctx.user.id,
              input.sectionId
            );
          }
          return db.updateCategoryAdmin(input.id, input);
        }),
      delete: managerProcedure
        .input(z.number())
        .mutation(async ({ ctx, input }) => {
          await db.assertManagerCategoryAccess(ctx.user.id, input);
          return db.deleteCategoryAdmin(input);
        }),
    }),
    brands: router({
      list: managerProcedure.query(({ ctx }) =>
        db.getBrandsForManager(ctx.user.id, ctx.user.role === "admin")
      ),
      create: adminProcedure
        .input(
          z.object({
            name: z.string(),
            brandCode: z
              .string()
              .regex(/^[A-Za-z0-9-]+$/)
              .optional(),
            slug: z.string().optional(),
            description: z.string().optional(),
            logo: z.string().optional(),
            image: z.string().optional(),
            managerId: z.number().int().positive().nullable().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(({ input }) => {
          const sanitized = {
            ...input,
            managerId: typeof input.managerId === "number" ? input.managerId : null,
          } as typeof input;
          return db.createBrandAdmin(sanitized);
        }),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            brandCode: z
              .string()
              .regex(/^[A-Za-z0-9-]+$/)
              .optional(),
            slug: z.string().optional(),
            description: z.string().optional(),
            logo: z.string().optional(),
            image: z.string().optional(),
            managerId: z.number().int().positive().nullable().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(({ input }) => {
          const sanitized = {
            ...input,
            managerId: Object.prototype.hasOwnProperty.call(input, "managerId")
              ? typeof (input as any).managerId === "number"
                ? (input as any).managerId
                : null
              : undefined,
          } as typeof input;
          return db.updateBrandAdmin(input.id, sanitized as any);
        }),
      delete: adminProcedure
        .input(z.number())
        .mutation(({ input }) => db.deleteBrandAdmin(input)),
    }),
    reviews: router({
      list: adminProcedure.query(() => db.getAllReviewsAdmin()),
      delete: adminProcedure
        .input(z.number())
        .mutation(({ input }) => db.deleteReviewAdmin(input)),
    }),
    welcomeMessages: router({
      list: adminProcedure.query(() => db.getAllWelcomeMessagesAdmin()),
      active: publicProcedure.query(() => db.getActiveWelcomeMessages()),
      create: adminProcedure
        .input(
          z.object({
            name: z.string(),
            content: z.string(),
            color: z.string().optional(),
            style: z.any().optional(),
          })
        )
        .mutation(({ input }) => db.createWelcomeMessageAdmin(input)),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            content: z.string().optional(),
            color: z.string().optional(),
            style: z.any().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(({ input }) => db.updateWelcomeMessageAdmin(input.id, input)),
      delete: adminProcedure
        .input(z.number())
        .mutation(({ input }) => db.deleteWelcomeMessageAdmin(input)),
    }),
    users: router({
      list: adminProcedure.query(() => db.getAllUsersAdmin()),
      create: adminProcedure
        .input(
          z.object({
            name: z.string(),
            email: z.string().email(),
            phone: z.string().optional(),
            address: z.string().optional(),
            role: z.enum(["user", "admin", "manager"]).optional(),
          })
        )
        .mutation(({ input }) => db.createUserAdmin(input)),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            username: z.string().min(3).optional(),
            password: z.string().min(1).optional(),
            role: z.enum(["user", "admin", "manager"]).optional(),
            categoryIds: z.array(z.number().int().positive()).optional(),
          })
        )
        .mutation(({ input }) => {
          const { id, ...data } = input;
          return db.updateUserAdmin(id, data);
        }),
      delete: adminProcedure
        .input(z.number())
        .mutation(({ input }) => db.deleteUserAdmin(input)),
    }),
    managers: router({
      list: adminProcedure.query(() => db.getManagersAdmin()),
      create: adminProcedure
        .input(
          z.object({
            username: z.string().min(3),
            password: z.string().min(8),
            name: z.string().min(1),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            role: z.enum(["admin", "manager"]).default("manager"),
            categoryIds: z.array(z.number().int().positive()).default([]),
          })
        )
        .mutation(({ input }) =>
          db.createManagerAdmin({
            ...input,
            passwordHash: hashManagerPassword(input.password),
          })
        ),
      update: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            username: z.string().min(3).optional(),
            password: z.string().min(8).optional(),
            name: z.string().min(1).optional(),
            email: z.string().email().nullable().optional(),
            phone: z.string().nullable().optional(),
            role: z.enum(["admin", "manager"]).optional(),
            categoryIds: z.array(z.number().int().positive()).optional(),
          })
        )
        .mutation(({ input }) => {
          const { id, password, ...data } = input;
          return db.updateManagerAdmin(id, {
            ...data,
            passwordHash: password ? hashManagerPassword(password) : undefined,
          });
        }),
      delete: adminProcedure
        .input(z.number().int().positive())
        .mutation(({ input }) => db.deleteUserAdmin(input)),
    }),
    finance: router({
      summary: managerProcedure
        .input(
          z.object({
            period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
          })
        )
        .query(({ ctx, input }) => {
          const now = new Date();
          const from = new Date(now);
          if (input.period === "daily") from.setHours(0, 0, 0, 0);
          if (input.period === "weekly") {
            from.setDate(now.getDate() - 6);
            from.setHours(0, 0, 0, 0);
          }
          if (input.period === "monthly") {
            from.setDate(1);
            from.setHours(0, 0, 0, 0);
          }
          return db.getEconomicSummary(
            ctx.user.role === "admin" ? undefined : ctx.user.id,
            from,
            now
          );
        }),
      sales: router({
        list: managerProcedure.query(({ ctx }) =>
          db
            .getEconomicLedgerRows(
              ctx.user.role === "admin" ? undefined : ctx.user.id
            )
            .then(rows => rows.sales)
        ),
        create: managerProcedure
          .input(
            z.object({
              productName: z.string().min(1),
              quantity: z.number().int().positive(),
              unitPrice: z.number().nonnegative(),
              unitCost: z.number().nonnegative().default(0),
              categoryId: z.number().int().positive().nullable().optional(),
              productId: z.number().int().positive().nullable().optional(),
              saleDate: z.coerce.date().optional(),
            })
          )
          .mutation(({ ctx, input }) =>
            db.recordSale({
              ...input,
              managerId: ctx.user.id,
              categoryId: input.categoryId ?? null,
              productId: input.productId ?? null,
            })
          ),
        delete: managerProcedure
          .input(z.number().int().positive())
          .mutation(({ input }) => db.deleteFinancialEntry("sales", input)),
      }),
      purchases: router({
        list: managerProcedure.query(({ ctx }) =>
          db
            .getEconomicLedgerRows(
              ctx.user.role === "admin" ? undefined : ctx.user.id
            )
            .then(rows => rows.purchases)
        ),
        create: managerProcedure
          .input(
            z.object({
              productName: z.string().min(1),
              quantity: z.number().int().positive(),
              unitCost: z.number().nonnegative(),
              categoryId: z.number().int().positive().nullable().optional(),
              productId: z.number().int().positive().nullable().optional(),
              purchaseDate: z.coerce.date().optional(),
            })
          )
          .mutation(({ ctx, input }) =>
            db.recordPurchase({
              ...input,
              managerId: ctx.user.id,
              categoryId: input.categoryId ?? null,
              productId: input.productId ?? null,
            })
          ),
        delete: managerProcedure
          .input(z.number().int().positive())
          .mutation(({ input }) => db.deleteFinancialEntry("purchases", input)),
      }),
      expenses: router({
        list: managerProcedure.query(({ ctx }) =>
          db
            .getEconomicLedgerRows(
              ctx.user.role === "admin" ? undefined : ctx.user.id
            )
            .then(rows => rows.expenses)
        ),
        create: managerProcedure
          .input(
            z.object({
              title: z.string().min(1),
              expenseCategory: z.string().min(1),
              amount: z.number().nonnegative(),
              notes: z.string().nullable().optional(),
              expenseDate: z.coerce.date().optional(),
            })
          )
          .mutation(({ ctx, input }) =>
            db.createExpense({ ...input, managerId: ctx.user.id })
          ),
        update: managerProcedure
          .input(
            z.object({
              id: z.number().int().positive(),
              title: z.string().min(1).optional(),
              expenseCategory: z.string().min(1).optional(),
              amount: z.number().nonnegative().optional(),
              notes: z.string().nullable().optional(),
              expenseDate: z.coerce.date().optional(),
            })
          )
          .mutation(({ input }) => {
            const { id, ...data } = input;
            return db.updateExpense(id, data);
          }),
        delete: managerProcedure
          .input(z.number().int().positive())
          .mutation(({ input }) => db.deleteExpense(input)),
      }),
      cash: router({
        list: managerProcedure.query(({ ctx }) =>
          db
            .getEconomicLedgerRows(
              ctx.user.role === "admin" ? undefined : ctx.user.id
            )
            .then(rows => rows.cashTransactions)
        ),
        create: managerProcedure
          .input(
            z.object({
              type: z.enum(["income", "expense", "adjustment"]),
              amount: z.number().nonnegative(),
              description: z.string().min(1),
              transactionDate: z.coerce.date().optional(),
            })
          )
          .mutation(({ ctx, input }) =>
            db.createCashTransaction({ ...input, managerId: ctx.user.id })
          ),
        update: managerProcedure
          .input(
            z.object({
              id: z.number().int().positive(),
              type: z.enum(["income", "expense", "adjustment"]).optional(),
              amount: z.number().nonnegative().optional(),
              description: z.string().min(1).optional(),
              transactionDate: z.coerce.date().optional(),
            })
          )
          .mutation(({ input }) => {
            const { id, ...data } = input;
            return db.updateCashTransaction(id, data);
          }),
        delete: managerProcedure
          .input(z.number().int().positive())
          .mutation(({ input }) => db.deleteCashTransaction(input)),
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
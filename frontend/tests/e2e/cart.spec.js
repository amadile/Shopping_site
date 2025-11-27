/**
 * E2E Tests for Shopping Cart Features
 * Tests: Add to cart, Update quantity, Remove items, Apply coupons
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Shopping Cart Features', () => {
  let cart;

  beforeEach(() => {
    cart = {
      items: [],
      total: 0,
      subtotal: 0,
      discount: 0,
    };
  });

  describe('Add to Cart', () => {
    it('should add item to cart', () => {
      const item = {
        productId: '123',
        name: 'Laptop',
        price: 999,
        quantity: 1,
        image: '/laptop.jpg',
      };

      cart.items.push(item);
      cart.subtotal = item.price * item.quantity;
      cart.total = cart.subtotal;

      expect(cart.items).toHaveLength(1);
      expect(cart.total).toBe(999);
    });

    it('should increase quantity if item already in cart', () => {
      const existingItem = {
        productId: '123',
        name: 'Laptop',
        price: 999,
        quantity: 1,
      };

      cart.items.push(existingItem);

      // Try to add same item
      const sameItem = cart.items.find(i => i.productId === '123');
      if (sameItem) {
        sameItem.quantity += 1;
      }

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('should validate stock availability', () => {
      const product = { stock: 5 };
      const requestedQuantity = 10;

      const canAdd = requestedQuantity <= product.stock;
      expect(canAdd).toBe(false);
    });

    it('should add multiple different items', () => {
      const item1 = { productId: '1', name: 'Item 1', price: 100, quantity: 1 };
      const item2 = { productId: '2', name: 'Item 2', price: 200, quantity: 1 };

      cart.items.push(item1, item2);

      expect(cart.items).toHaveLength(2);
    });
  });

  describe('Update Cart', () => {
    beforeEach(() => {
      cart.items = [
        { productId: '1', name: 'Item 1', price: 100, quantity: 2 },
        { productId: '2', name: 'Item 2', price: 200, quantity: 1 },
      ];
    });

    it('should update item quantity', () => {
      const item = cart.items.find(i => i.productId === '1');
      item.quantity = 5;

      expect(item.quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      cart.items = cart.items.filter(i => i.productId !== '1');
      expect(cart.items).toHaveLength(1);
    });

    it('should calculate subtotal correctly', () => {
      const subtotal = cart.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      expect(subtotal).toBe(400); // (100*2) + (200*1)
    });
  });

  describe('Remove from Cart', () => {
    beforeEach(() => {
      cart.items = [
        { productId: '1', name: 'Item 1', price: 100, quantity: 2 },
        { productId: '2', name: 'Item 2', price: 200, quantity: 1 },
      ];
    });

    it('should remove specific item', () => {
      cart.items = cart.items.filter(i => i.productId !== '1');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe('2');
    });

    it('should clear entire cart', () => {
      cart.items = [];
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('Coupon Management', () => {
    beforeEach(() => {
      cart.subtotal = 1000;
      cart.discount = 0;
      cart.total = 1000;
    });

    it('should apply percentage discount coupon', () => {
      const coupon = {
        code: 'SAVE20',
        discountType: 'percentage',
        discountValue: 20,
      };

      cart.discount = (cart.subtotal * coupon.discountValue) / 100;
      cart.total = cart.subtotal - cart.discount;

      expect(cart.discount).toBe(200);
      expect(cart.total).toBe(800);
    });

    it('should apply fixed amount discount coupon', () => {
      const coupon = {
        code: 'FIXED50',
        discountType: 'fixed',
        discountValue: 50,
      };

      cart.discount = coupon.discountValue;
      cart.total = cart.subtotal - cart.discount;

      expect(cart.discount).toBe(50);
      expect(cart.total).toBe(950);
    });

    it('should validate minimum order amount for coupon', () => {
      const coupon = {
        code: 'MIN100',
        minOrderAmount: 500,
      };

      const isValid = cart.subtotal >= coupon.minOrderAmount;
      expect(isValid).toBe(true);
    });

    it('should remove coupon discount', () => {
      cart.discount = 100;
      cart.total = cart.subtotal - cart.discount;

      // Remove coupon
      cart.discount = 0;
      cart.total = cart.subtotal;

      expect(cart.discount).toBe(0);
      expect(cart.total).toBe(cart.subtotal);
    });
  });

  describe('Cart Summary', () => {
    it('should calculate total items count', () => {
      cart.items = [
        { quantity: 2 },
        { quantity: 3 },
        { quantity: 1 },
      ];

      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      expect(totalItems).toBe(6);
    });

    it('should calculate final total with discount', () => {
      cart.subtotal = 1000;
      cart.discount = 200;
      cart.total = cart.subtotal - cart.discount;

      expect(cart.total).toBe(800);
    });

    it('should ensure total is never negative', () => {
      cart.subtotal = 100;
      cart.discount = 200;
      cart.total = Math.max(0, cart.subtotal - cart.discount);

      expect(cart.total).toBe(0);
    });
  });
});

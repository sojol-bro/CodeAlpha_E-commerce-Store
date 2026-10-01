import { Router } from 'express';
import { CartModel, CartItemModel, ProductVariantModel } from '../models';

export const cartRouter = Router();

cartRouter.get('/', async (req, res) => {
  try {
    const cartId = req.query.cartId ? String(req.query.cartId) : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;

    let cart;
    if (cartId) {
      cart = await CartModel.findById(cartId);
    }
    if (!cart && userId) {
      cart = await CartModel.findActiveByUserId(userId);
    }
    if (!cart) {
      cart = await CartModel.getOrCreate(userId);
    }

    const fullCart = await CartModel.getFullCart(cart.id);
    res.json(fullCart);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cartRouter.post('/items', async (req, res) => {
  try {
    const { cartId, variantId, quantity = 1 } = req.body;
    if (!variantId) {
      return res.status(400).json({ error: 'variantId is required' });
    }

    const variant = await ProductVariantModel.findById(variantId);
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    let targetCartId = cartId;
    if (!targetCartId) {
      const newCart = await CartModel.getOrCreate(null);
      targetCartId = newCart.id;
    }

    const price = parseFloat((variant.price ?? 0).toString());
    const qty = Math.max(1, parseInt(String(quantity), 10));

    await CartItemModel.addItem({
      cartId: targetCartId,
      variantId,
      quantity: qty,
      unitPrice: price,
    });

    const fullCart = await CartModel.getFullCart(targetCartId);
    res.json(fullCart);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cartRouter.patch('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cartId, quantity } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: 'cartId is required' });
    }

    const qty = parseInt(String(quantity), 10);
    await CartItemModel.updateQuantity(id, cartId, qty);

    const fullCart = await CartModel.getFullCart(cartId);
    res.json(fullCart);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cartRouter.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: 'cartId is required' });
    }

    await CartItemModel.removeItem(id, cartId);
    const fullCart = await CartModel.getFullCart(cartId);
    res.json(fullCart);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cartRouter.delete('/', async (req, res) => {
  try {
    const { cartId } = req.body;
    if (!cartId) {
      return res.status(400).json({ error: 'cartId is required' });
    }
    await CartModel.clearCart(cartId);
    res.json({ message: 'Cart cleared successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

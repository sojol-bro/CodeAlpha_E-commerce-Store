import { Router } from 'express';
import { WishlistModel, WishlistItemModel } from '../models';

export const wishlistRouter = Router();

wishlistRouter.get('/', async (req, res) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : null;
    const wishlist = await WishlistModel.getOrCreate(userId);
    const items = await WishlistModel.getWishlistWithProducts(wishlist.id);
    res.json({ wishlist, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

wishlistRouter.post('/toggle', async (req, res) => {
  try {
    const { productId, userId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const wishlist = await WishlistModel.getOrCreate(userId || null);
    const outcome = await WishlistItemModel.toggle(wishlist.id, productId);
    const items = await WishlistModel.getWishlistWithProducts(wishlist.id);

    res.json({
      action: outcome.action,
      items,
      count: items.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

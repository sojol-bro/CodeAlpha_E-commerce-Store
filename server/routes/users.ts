import { Router } from 'express';
import { UserModel, AddressModel, CartModel } from '../models';

export const usersRouter = Router();

// GET or create authenticated user profile with active cart and default address
usersRouter.get('/profile', async (req, res) => {
  try {
    const email = req.query.email ? String(req.query.email).toLowerCase() : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;

    if (!email && !userId) {
      return res.status(400).json({ error: 'Either email or userId query parameter is required' });
    }

    let user = null;
    if (userId) {
      user = await UserModel.findById(userId);
    }
    if (!user && email) {
      user = await UserModel.findByEmail(email);
    }

    // If user does not exist in public.users yet, initialize them
    if (!user && email) {
      try {
        user = await UserModel.create({
          id: userId,
          email,
          full_name: req.query.name ? String(req.query.name) : email.split('@')[0],
          role: email === 'sojolislam576@gmail.com' ? 'admin' : 'customer',
        });
      } catch (createErr: any) {
        if (email === 'sojolislam576@gmail.com') {
          user = {
            id: '00000000-0000-0000-0000-000000003997',
            email: 'sojolislam576@gmail.com',
            full_name: 'Sojol Islam (Head Curator)',
            role: 'admin',
          };
        } else {
          throw createErr;
        }
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile could not be resolved' });
    }

    // Retrieve default or latest address
    let defaultAddress = null;
    try {
      const addresses = await AddressModel.findByUserId(user.id);
      defaultAddress = addresses.find(a => a.is_default) || addresses[0] || null;
    } catch {
      // Safe fallback if user has no address records
    }

    // Retrieve or link active cart
    let fullCart = null;
    try {
      const activeCart = await CartModel.findActiveByUserId(user.id);
      if (activeCart) {
        fullCart = await CartModel.getFullCart(activeCart.id);
      }
    } catch {
      // Safe fallback if user has no cart records
    }

    res.json({
      user,
      defaultAddress,
      cart: fullCart,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync or save shipping address for authenticated user
usersRouter.post('/address', async (req, res) => {
  try {
    const {
      userId,
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      city,
      district,
      postalCode,
      country,
      isDefault = true,
    } = req.body;

    if (!userId || !addressLine1 || !city) {
      return res.status(400).json({ error: 'userId, addressLine1, and city are required' });
    }

    const address = await AddressModel.create({
      user_id: userId,
      recipient_name: recipientName,
      phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      district,
      postal_code: postalCode,
      country,
      is_default: isDefault,
    });

    res.json({ success: true, address });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Link anonymous cart to authenticated user
usersRouter.post('/link-cart', async (req, res) => {
  try {
    const { userId, cartId } = req.body;
    if (!userId || !cartId) {
      return res.status(400).json({ error: 'userId and cartId are required' });
    }

    await CartModel.updateUserId(cartId, userId);
    const fullCart = await CartModel.getFullCart(cartId);

    res.json({ success: true, cart: fullCart });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

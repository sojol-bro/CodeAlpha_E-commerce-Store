import { Router } from 'express';
import {
  ShippingMethodModel,
  CouponModel,
  AddressModel,
  OrderModel,
  OrderItemModel,
  PaymentModel,
  ShipmentModel,
  ProductVariantModel,
  InventoryTransactionModel,
  AuditLogModel,
  CartModel,
  ReturnModel,
  ReturnItemModel,
} from '../models';
import SSLCommerzPayment from 'sslcommerz-lts';
import { query } from '../db';

export const ordersRouter = Router();

ordersRouter.get('/', async (req, res) => {
  try {
    const orders = await OrderModel.findAll(50);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

ordersRouter.post('/checkout', async (req, res) => {
  try {
    const {
      cartId,
      userId,
      shippingAddress,
      shippingMethodId,
      paymentMethod = 'Credit Card (Stripe Simulated)',
      couponCode,
      notes,
    } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: 'cartId is required' });
    }

    if (!shippingAddress || !shippingAddress.recipientName || !shippingAddress.addressLine1) {
      return res.status(400).json({ error: 'Valid shipping address is required' });
    }

    const { items, subtotal } = await CartModel.getFullCart(cartId);
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Your shopping bag is empty' });
    }

    // Determine shipping method
    let shippingFee = 15.0;
    let selectedShipMethod = null;
    if (shippingMethodId) {
      selectedShipMethod = await ShippingMethodModel.findById(shippingMethodId);
      if (selectedShipMethod) {
        shippingFee = parseFloat(selectedShipMethod.price.toString());
      }
    }

    // Complimentary shipping threshold
    if (subtotal >= 250) {
      shippingFee = 0;
    }

    // Apply coupon if valid
    let discountAmount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      const couponCheck = await CouponModel.validateCoupon(couponCode, subtotal);
      if (couponCheck.valid && couponCheck.coupon) {
        discountAmount = couponCheck.discountAmount;
        validatedCoupon = couponCheck.coupon;
        await CouponModel.incrementUsage(validatedCoupon.id);
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount + shippingFee) * 100) / 100);

    // Save shipping address
    const savedAddress = await AddressModel.create({
      user_id: userId || null,
      recipient_name: shippingAddress.recipientName,
      phone: shippingAddress.phone || null,
      address_line1: shippingAddress.addressLine1,
      address_line2: shippingAddress.addressLine2 || null,
      city: shippingAddress.city || 'Metropolis',
      district: shippingAddress.state || shippingAddress.district || null,
      postal_code: shippingAddress.postalCode || '10001',
      country: shippingAddress.country || 'United States',
      is_default: false,
    });

    // Generate distinctive luxury order number
    const randomSuffix = Math.floor(100000 + Math.random() * 899999);
    const orderNumber = `MIO-${new Date().getFullYear()}-${randomSuffix}`;

    // Create Order with pending status
    const order = await OrderModel.create({
      order_number: orderNumber,
      user_id: userId || null,
      shipping_address_id: savedAddress.id,
      status: 'pending',
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      payment_status: 'unpaid',
    });

    // Create Order Items but do NOT adjust inventory yet
    for (const item of items) {
      const itemUnit = parseFloat(item.unit_price);
      const itemTotal = Math.round(itemUnit * item.quantity * 100) / 100;

      await OrderItemModel.create({
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        product_name: item.product_title,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: itemUnit,
        total_price: itemTotal,
        size: item.size,
        color: item.color,
      });
    }

    const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'qwerty';
    const is_live = false; 
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    const data = {
      total_amount: totalAmount,
      currency: 'USD',
      tran_id: order.id,
      success_url: `http://localhost:3000/api/orders/sslcommerz/success?cartId=${cartId}`,
      fail_url: `http://localhost:3000/api/orders/sslcommerz/fail`,
      cancel_url: `http://localhost:3000/api/orders/sslcommerz/cancel`,
      ipn_url: `http://localhost:3000/api/orders/sslcommerz/ipn`,
      shipping_method: 'Courier',
      product_name: 'MIO Products',
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: shippingAddress.recipientName,
      cus_email: 'customer@mio-luxury.com',
      cus_add1: shippingAddress.addressLine1,
      cus_add2: shippingAddress.addressLine2 || 'N/A',
      cus_city: shippingAddress.city || 'Dhaka',
      cus_state: shippingAddress.state || 'Dhaka',
      cus_postcode: shippingAddress.postalCode || '1000',
      cus_country: shippingAddress.country || 'Bangladesh',
      cus_phone: shippingAddress.phone || '01711111111',
      cus_fax: '01711111111',
      ship_name: shippingAddress.recipientName,
      ship_add1: shippingAddress.addressLine1,
      ship_add2: shippingAddress.addressLine2 || 'N/A',
      ship_city: shippingAddress.city || 'Dhaka',
      ship_state: shippingAddress.state || 'Dhaka',
      ship_postcode: shippingAddress.postalCode || '1000',
      ship_country: shippingAddress.country || 'Bangladesh',
    };
    
    sslcz.init(data).then(apiResponse => {
      if (apiResponse?.GatewayPageURL) {
        res.json({
          success: true,
          redirectUrl: apiResponse.GatewayPageURL,
          message: 'Redirecting to SSLCommerz gateway...'
        });
      } else {
        res.status(500).json({ error: 'Failed to initialize SSLCommerz payment' });
      }
    }).catch((err: any) => {
      res.status(500).json({ error: err.message });
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SSLCommerz Webhooks
ordersRouter.post('/sslcommerz/success', async (req, res) => {
  try {
    const { tran_id, val_id, amount, currency } = req.body;
    const { cartId } = req.query;
    
    // Finalize payments
    await PaymentModel.create({
      order_id: tran_id,
      payment_method: 'SSLCommerz',
      payment_provider: 'SSLCommerz Vault',
      transaction_id: val_id,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      status: 'completed',
    });

    // Update order status
    await OrderModel.updateStatus(tran_id, 'confirmed', 'paid');
    const order = await OrderModel.findById(tran_id);

    // Decrease inventory
    if (cartId) {
      const { items } = await CartModel.getFullCart(cartId as string);
      for (const item of items) {
        await ProductVariantModel.updateStock(item.product_variant_id, -item.quantity);
        await InventoryTransactionModel.create({
          product_variant_id: item.product_variant_id,
          transaction_type: 'purchase',
          quantity: -item.quantity,
          reference_id: tran_id,
          note: `Order ${order?.order_number} - SSLCommerz Paid`,
        });
      }
      await CartModel.clearCart(cartId as string);
    }
    
    res.redirect(`/?order_success=${order?.order_number}`);
  } catch (err: any) {
    res.redirect('/?payment=failed');
  }
});

ordersRouter.post('/sslcommerz/fail', async (req, res) => {
  res.redirect('/?payment=failed');
});

ordersRouter.post('/sslcommerz/cancel', async (req, res) => {
  res.redirect('/?payment=cancelled');
});

ordersRouter.post('/sslcommerz/ipn', async (req, res) => {
  res.json({ success: true });
});

ordersRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await OrderModel.findByUserId(userId);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

ordersRouter.get('/:orderNumberOrId', async (req, res) => {
  try {
    const { orderNumberOrId } = req.params;
    const order = await OrderModel.findByReference(orderNumberOrId);
    if (!order) {
      return res.status(404).json({ error: `No acquisition record found matching "${orderNumberOrId}". Please verify your order number (e.g. MIO-2026-XXXXXX) or tracking ID (e.g. MIO-EXP-XXXXXX).` });
    }
    res.json({ order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

ordersRouter.post('/returns', async (req, res) => {
  try {
    const { orderId, orderItemId, quantity = 1, reason, customerNote } = req.body;
    if (!orderId || !reason) {
      return res.status(400).json({ error: 'orderId and reason are required' });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const returnRecord = await ReturnModel.create({
      order_id: orderId,
      reason,
      customer_note: customerNote || '',
      status: 'requested',
      refund_amount: order.total_amount ? parseFloat(order.total_amount.toString()) : undefined,
    });

    if (orderItemId) {
      await ReturnItemModel.create({
        return_id: returnRecord.id,
        order_item_id: orderItemId,
        quantity: parseInt(String(quantity), 10) || 1,
        reason,
        condition: 'sealed',
      });
    }

    await AuditLogModel.log({
      action: 'RETURN_REQUESTED',
      entity_type: 'RETURN',
      entity_id: returnRecord.id,
      new_data: {
        orderId,
        reason,
      },
    });

    res.json({
      success: true,
      return: returnRecord,
      message: 'Return dossier submitted. Our VIP concierge will review your request within 24 hours.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

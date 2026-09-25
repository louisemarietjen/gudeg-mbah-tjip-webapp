/* Gudeg Mbah Tjip - Supabase integration */
(function () {
  const configured =
    window.SUPABASE_URL &&
    window.SUPABASE_PUBLISHABLE_KEY &&
    !window.SUPABASE_URL.includes('YOUR-PROJECT') &&
    !window.SUPABASE_PUBLISHABLE_KEY.includes('YOUR_');

  if (!configured || !window.supabase) {
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );
})();

async function saveOrderToSupabase(order) {
  const client = window.supabaseClient;
  if (!client) return { ok: false, configured: false, error: new Error('Supabase client is not configured') };

  // Match the current database schema:
  // orders.id = uuid, orders.order_code = required text,
  // order_items uses product_id/product_name/unit_price/subtotal.
  const orderId = crypto.randomUUID();
  const orderCode = order.id || `MHTP-${Date.now().toString().slice(-6)}`;

  const orderRow = {
    id: orderId,
    order_code: orderCode,
    order_type: order.mode,
    customer_name: order.customer?.name || null,
    customer_phone: order.customer?.phone || null,
    table_number: order.table ? Number(order.table) : null,
    pickup_date: order.customer?.date || null,
    pickup_time: order.customer?.time || null,
    notes: order.customer?.notes || null,
    payment_method: order.payment || null,
    total: Math.round(Number(order.total) || 0),
    status: 'Diproses'
  };

  const { error: orderError } = await client
    .from('orders')
    .insert(orderRow);

  if (orderError) return { ok: false, configured: true, error: orderError };

  const productNames = [...new Set(order.items.map((item) => item.product.name))];
  const aliases = {};
  productNames.forEach((name) => {
    aliases[name] = name === 'Gudeg' ? 'Gudeg' : name;
  });

  const dbNames = [...new Set(Object.values(aliases))];
  const { data: dbFoods, error: foodsError } = await client
    .from('foods')
    .select('id,name,price')
    .in('name', dbNames);

  if (foodsError) return { ok: false, configured: true, error: foodsError };

  const foodByName = new Map((dbFoods || []).map((food) => [food.name, food]));
  const missing = productNames.filter((name) => !foodByName.has(aliases[name]));
  if (missing.length) {
    return {
      ok: false,
      configured: true,
      error: new Error(`Menu tidak ditemukan di Supabase: ${missing.join(', ')}`)
    };
  }

  const itemRows = order.items.map((item) => {
    const food = foodByName.get(aliases[item.product.name]);
    const unitPrice = Math.round(Number(item.product.price) || Number(food.price) || 0);
    return {
      order_id: orderId,
      product_id: food.id,
      product_name: item.product.name,
      quantity: item.qty,
      unit_price: unitPrice,
      subtotal: unitPrice * item.qty
    };
  });

  const { error: itemsError } = await client
    .from('order_items')
    .insert(itemRows);

  if (itemsError) return { ok: false, configured: true, error: itemsError };

  return { ok: true, configured: true, data: { id: orderId, orderCode } };
}

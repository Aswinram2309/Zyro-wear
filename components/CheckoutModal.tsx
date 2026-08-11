'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem, CustomerDetails } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClearCart: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onClearCart,
}: CheckoutModalProps) {
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [step, setStep] = useState<'form' | 'payment' | 'processing'>('form');
  const [loading, setLoading] = useState<boolean>(false);
  const [orderSession, setOrderSession] = useState<{
    razorpayOrderId: string;
    amount: number;
    subtotal: number;
    shippingFee: number;
  } | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= 999 ? 0 : 49;
  const totalAmount = subtotal + shippingFee;

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CustomerDetails, string>> = {};
    if (!customer.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!customer.phone.trim() || customer.phone.trim().length < 10)
      errors.phone = 'Valid 10-digit Phone Number is required';
    if (!customer.email.trim() || !customer.email.includes('@'))
      errors.email = 'Valid Email is required';
    if (!customer.address.trim()) errors.address = 'Delivery Address is required';
    if (!customer.city.trim()) errors.city = 'City is required';
    if (!customer.state.trim()) errors.state = 'State is required';
    if (!customer.pincode.trim() || customer.pincode.trim().length < 6)
      errors.pincode = 'Valid 6-digit Pincode is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
      }));

      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, customer }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to initialize payment session.');
        setLoading(false);
        return;
      }

      setOrderSession({
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
      });
      setStep('payment');
    } catch (err: any) {
      console.error(err);
      alert('Error starting payment session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderSession) return;
    setStep('processing');
    setLoading(true);

    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
      }));

      const verifyRes = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: itemsPayload,
          razorpayOrderId: orderSession.razorpayOrderId,
          razorpayPaymentId: `pay_test_${Date.now()}`,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        alert(verifyData.error || 'Payment verification failed.');
        setStep('payment');
        setLoading(false);
        return;
      }

      // Small delay for smooth UX transition
      setTimeout(() => {
        onClearCart();
        onClose();
        router.push(
          `/order-confirmation?order=${verifyData.orderNumber}&name=${encodeURIComponent(
            customer.fullName
          )}&total=${verifyData.totalAmount}`
        );
      }, 600);
    } catch (err: any) {
      console.error(err);
      alert('Error verifying payment.');
      setStep('payment');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal active">
      <div className="modal-backdrop active" onClick={step === 'processing' ? undefined : onClose}></div>
      <div className="checkout-modal-content">
        <div className="checkout-modal-header">
          <h3>
            <i className="fa-solid fa-shield-halved" style={{ color: '#FFE600', marginRight: '8px' }}></i>
            {step === 'form'
              ? 'GUEST CHECKOUT — DELIVERY DETAILS'
              : step === 'payment'
              ? 'TEST PAYMENT PROTOTYPE'
              : 'PROCESSING ORDER'}
          </h3>
          {step !== 'processing' && (
            <button className="close-checkout" onClick={onClose}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {step === 'form' ? (
          <form className="checkout-form-grid" onSubmit={handleProceedToPayment}>
            <div className="form-column">
              <h4 className="form-section-title">1. Customer Information</h4>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aswin Ram"
                  value={customer.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={formErrors.fullName ? 'error' : ''}
                />
                {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit Mobile Number"
                    value={customer.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={formErrors.phone ? 'error' : ''}
                  />
                  {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={customer.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                </div>
              </div>

              <h4 className="form-section-title" style={{ marginTop: '20px' }}>
                2. Shipping Address
              </h4>

              <div className="form-group">
                <label>Street Address / Door No / Apartment *</label>
                <input
                  type="text"
                  placeholder="House/Flat No, Street Name, Area"
                  value={customer.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={formErrors.address ? 'error' : ''}
                />
                {formErrors.address && <span className="field-error">{formErrors.address}</span>}
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={customer.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={formErrors.city ? 'error' : ''}
                  />
                  {formErrors.city && <span className="field-error">{formErrors.city}</span>}
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tamil Nadu"
                    value={customer.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={formErrors.state ? 'error' : ''}
                  />
                  {formErrors.state && <span className="field-error">{formErrors.state}</span>}
                </div>

                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    placeholder="6 digits"
                    value={customer.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className={formErrors.pincode ? 'error' : ''}
                  />
                  {formErrors.pincode && <span className="field-error">{formErrors.pincode}</span>}
                </div>
              </div>
            </div>

            <div className="summary-column">
              <h4 className="form-section-title">Order Summary</h4>
              <div className="checkout-items-preview">
                {cart.map((item, idx) => (
                  <div key={idx} className="checkout-item-row">
                    <img src={item.product.front_img} alt={item.product.name} />
                    <div className="checkout-item-info">
                      <strong className="item-title">{item.product.name}</strong>
                      <span className="item-meta">
                        Size: {item.size} | Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="item-price">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="checkout-price-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="breakdown-row">
                  <span>Express Shipping</span>
                  <span>{shippingFee === 0 ? 'FREE' : '₹49'}</span>
                </div>
                <div className="breakdown-row total-row">
                  <span>Grand Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <button type="submit" className="btn-pay-submit" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> PREPARING TEST PAYMENT...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i> PROCEED TO TEST PAYMENT — ₹{totalAmount}
                  </>
                )}
              </button>

              <div className="checkout-security-note">
                <i className="fa-solid fa-shield-check"></i> Guest Checkout • No Account Registration Required
              </div>
            </div>
          </form>
        ) : step === 'payment' ? (
          <div className="payment-simulation-box">
            <div className="test-badge-banner">⚡ RAZORPAY & UPI TEST MODE PROTOTYPE ⚡</div>

            <div className="payment-amount-display">
              <span className="amount-label">AMOUNT PAYABLE</span>
              <span className="amount-value">₹{orderSession?.amount}</span>
              <span className="order-ref">Order Ref: {orderSession?.razorpayOrderId}</span>
            </div>

            {/* Dummy QR Code Visual for Prototype */}
            <div className="qr-container">
              <div className="qr-box">
                <div className="qr-code-dummy">
                  <i className="fa-solid fa-qrcode qr-icon"></i>
                  <span className="qr-text">ZYRO WEAR TEST UPI QR</span>
                </div>
              </div>
              <p className="qr-instruction">
                Scan with any UPI App or click below to simulate instant test payment completion.
              </p>
            </div>

            <div className="simulated-payment-actions">
              <button className="btn-simulate-success" onClick={handleSimulatePayment} disabled={loading}>
                <i className="fa-solid fa-circle-check"></i> SIMULATE SUCCESSFUL TEST PAYMENT
              </button>

              <button className="btn-simulate-cancel" onClick={() => setStep('form')} disabled={loading}>
                <i className="fa-solid fa-arrow-left"></i> BACK TO DETAILS
              </button>
            </div>
          </div>
        ) : (
          /* Processing Screen */
          <div className="processing-order-box">
            <div className="processing-spinner-wrapper">
              <i className="fa-solid fa-circle-notch fa-spin processing-spinner"></i>
            </div>
            <h3 className="processing-title">PROCESSING YOUR ORDER...</h3>
            <p className="processing-desc">
              Please wait while we verify your test payment and confirm your delivery details.
            </p>

            <div className="processing-checklist">
              <div className="checklist-item done">
                <i className="fa-solid fa-circle-check"></i> Test Payment Authorized
              </div>
              <div className="checklist-item active">
                <i className="fa-solid fa-spinner fa-spin"></i> Verifying Server Signature & Security
              </div>
              <div className="checklist-item pending">
                <i className="fa-solid fa-circle text-muted"></i> Generating Order Reference & Saving to Supabase
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

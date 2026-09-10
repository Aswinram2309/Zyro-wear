'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem, CustomerDetails } from '@/shared/types';

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
    altPhone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [step, setStep] = useState<'form' | 'payment' | 'processing'>('form');
  const [loading, setLoading] = useState<boolean>(false);

  // PIN Code Auto-Lookup State
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState<boolean>(false);
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pincodeMessage, setPincodeMessage] = useState<string>('');

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= 999 ? 0 : 49;
  const totalAmount = subtotal + shippingFee;

  const fetchLocationByPincode = async (pin: string) => {
    setPincodeLoading(true);
    setPincodeStatus('loading');
    setPincodeMessage('Fetching location...');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].Status === 'Success' &&
        Array.isArray(data[0].PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        const fetchedCity = po.District || po.Division || po.Block || po.Name || '';
        const fetchedState = po.State || '';

        if (fetchedCity || fetchedState) {
          setCustomer((prev) => ({
            ...prev,
            city: fetchedCity || prev.city,
            state: fetchedState || prev.state,
          }));
          setPincodeStatus('success');
          setPincodeMessage(`Location detected: ${[fetchedCity, fetchedState].filter(Boolean).join(', ')}`);
          setFormErrors((prev) => ({
            ...prev,
            pincode: undefined,
            city: undefined,
            state: undefined,
          }));
        } else {
          setPincodeStatus('error');
          setPincodeMessage('Invalid PIN code. Please check and try again.');
          setFormErrors((prev) => ({
            ...prev,
            pincode: 'Invalid PIN code. Please check and try again.',
          }));
        }
      } else {
        setPincodeStatus('error');
        setPincodeMessage('Invalid PIN code. Please check and try again.');
        setCustomer((prev) => ({ ...prev, city: '', state: '' }));
        setFormErrors((prev) => ({
          ...prev,
          pincode: 'Invalid PIN code. Please check and try again.',
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Pincode auto-lookup fallback:', err);
      setPincodeStatus('error');
      setPincodeMessage('Could not auto-fetch location. Please enter City and State manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    const cleanPin = value.replace(/\D/g, '').slice(0, 6);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setCustomer((prev) => {
      // When pincode is modified or cleared, reset auto-fetched city and state
      if (prev.pincode !== cleanPin) {
        return {
          ...prev,
          pincode: cleanPin,
          city: cleanPin.length < 6 ? '' : prev.city,
          state: cleanPin.length < 6 ? '' : prev.state,
        };
      }
      return { ...prev, pincode: cleanPin };
    });

    if (formErrors.pincode) {
      setFormErrors((prev) => ({ ...prev, pincode: undefined }));
    }

    if (cleanPin.length < 6) {
      setPincodeLoading(false);
      setPincodeStatus('idle');
      setPincodeMessage('');
      return;
    }

    if (cleanPin.length === 6) {
      fetchLocationByPincode(cleanPin);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CustomerDetails, string>> = {};
    if (!customer.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!customer.phone.trim() || customer.phone.trim().length < 10)
      errors.phone = 'Valid 10-digit Phone Number is required';
    if (customer.altPhone && customer.altPhone.trim() && customer.altPhone.trim().length < 10)
      errors.altPhone = 'Valid 10-digit Alternative Phone Number is required';
    if (customer.email && customer.email.trim() && !customer.email.includes('@'))
      errors.email = 'Valid Email Address is required';
    if (!customer.address.trim()) errors.address = 'Delivery Address is required';
    
    // Pincode validation
    if (!customer.pincode.trim() || customer.pincode.trim().length !== 6 || !/^\d{6}$/.test(customer.pincode.trim())) {
      errors.pincode = 'Valid 6-digit Indian PIN code is required';
    } else if (pincodeStatus === 'error' && pincodeMessage.includes('Invalid PIN code')) {
      errors.pincode = 'Invalid PIN code. Please check and try again.';
    }

    if (!customer.city.trim()) errors.city = 'City is required';
    if (!customer.state.trim()) errors.state = 'State is required';

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

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Failed to load Razorpay checkout. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TZaCJ2Et6ERjcc';
      const orderId = data.razorpayOrderId || data.order_id || data.id;

      if (!orderId) {
        alert('Could not retrieve valid Razorpay Order ID. Please try again.');
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: data.amount ? (data.amount <= 10000 && !Number.isInteger(data.amount) ? Math.round(data.amount * 100) : (data.amount < 1000 ? data.amount * 100 : data.amount)) : totalAmount * 100,
        currency: data.currency || 'INR',
        name: 'ZYRO Wear',
        description: 'Order Payment',
        order_id: orderId,
        prefill: {
          name: customer.fullName,
          email: customer.email || '',
          contact: customer.phone,
        },
        theme: {
          color: '#FFE600',
        },
        handler: async function (response: any) {
          await verifyPayment(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        alert(`Payment Failed: ${response.error?.description || response.error?.reason || 'Transaction could not be completed.'}`);
        setLoading(false);
      });
      
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Error starting payment session: ' + (err.message || 'Please try again.'));
      setLoading(false);
    }
  };

  const verifyPayment = async (razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
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
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        alert(verifyData.error || 'Payment verification failed.');
        setStep('form');
        setLoading(false);
        return;
      }

      onClearCart();
      onClose();
      router.push(
        `/order-confirmation?order=${verifyData.orderNumber}&name=${encodeURIComponent(
          customer.fullName
        )}&total=${verifyData.totalAmount}`
      );
    } catch (err: any) {
      console.error(err);
      alert('Error verifying payment.');
      setStep('form');
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
                  placeholder="e.g. Abinaya"
                  value={customer.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={formErrors.fullName ? 'error' : ''}
                />
                {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Primary Phone Number *</label>
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
                  <label>Alt. Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="Alternative Phone (Optional)"
                    value={customer.altPhone || ''}
                    onChange={(e) => handleInputChange('altPhone', e.target.value)}
                    className={formErrors.altPhone ? 'error' : ''}
                  />
                  {formErrors.altPhone && <span className="field-error">{formErrors.altPhone}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@domain.com (Optional)"
                  value={customer.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
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

              {/* Pincode with Auto-Fetch State, followed by City and State */}
              <div className="form-row-3">
                <div className="form-group pincode-group">
                  <label>Pincode (6 digits) *</label>
                  <div className="pincode-input-wrapper">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="e.g. 625009"
                      value={customer.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className={formErrors.pincode ? 'error' : pincodeStatus === 'success' ? 'success' : ''}
                    />
                    {pincodeLoading && (
                      <span className="pincode-spinner">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      </span>
                    )}
                    {!pincodeLoading && pincodeStatus === 'success' && (
                      <span className="pincode-check">
                        <i className="fa-solid fa-circle-check"></i>
                      </span>
                    )}
                  </div>
                  {pincodeLoading && (
                    <span className="pincode-status-text loading">
                      <i className="fa-solid fa-spinner fa-spin"></i> Fetching location...
                    </span>
                  )}
                  {!pincodeLoading && pincodeStatus === 'success' && (
                    <span className="pincode-status-text success">
                      <i className="fa-solid fa-circle-check"></i> {pincodeMessage}
                    </span>
                  )}
                  {formErrors.pincode && (
                    <span className="field-error">{formErrors.pincode}</span>
                  )}
                  {!formErrors.pincode && pincodeStatus === 'error' && (
                    <span className="pincode-status-text error">{pincodeMessage}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>City / District *</label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai"
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
                    <i className="fa-solid fa-spinner fa-spin"></i> PREPARING PAYMENT...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i> PROCEED TO PAY — ₹{totalAmount}
                  </>
                )}
              </button>

              <div className="checkout-security-note">
                <i className="fa-solid fa-shield-check"></i> 100% Secure Checkout • UPI, Cards & NetBanking
              </div>
            </div>
          </form>
        ) : (
          /* Processing Screen */
          <div className="processing-order-box">
            <div className="processing-spinner-wrapper">
              <i className="fa-solid fa-circle-notch fa-spin processing-spinner"></i>
            </div>
            <h3 className="processing-title">PROCESSING YOUR ORDER...</h3>
            <p className="processing-desc">
              Please wait while we verify your payment and confirm your delivery details.
            </p>

            <div className="processing-checklist">
              <div className="checklist-item done">
                <i className="fa-solid fa-circle-check"></i> Payment Authorized
              </div>
              <div className="checklist-item active">
                <i className="fa-solid fa-spinner fa-spin"></i> Verifying Server Signature & Security
              </div>
              <div className="checklist-item pending">
                <i className="fa-solid fa-circle text-muted"></i> Generating Order Reference & Saving Order
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { Fragment, useEffect, useRef } from "react";
import CheckoutSteps from "../cart/CheckoutSteps";
import { useSelector, useDispatch } from "react-redux";
import MetaData from "../layout/Metadata";
import { Typography } from "@material-ui/core";
// import { useAlert } from "react-alert";
import { CardNumberElement, CardCvcElement, CardExpiryElement, useStripe, useElements, } from "@stripe/react-stripe-js";
import axios from "axios";
import "./payment.css";
import CreditCardIcon from "@material-ui/icons/CreditCard";
import EventIcon from "@material-ui/icons/Event";
import VpnKeyIcon from "@material-ui/icons/VpnKey";
import { useNavigate } from "react-router-dom";
import { clearErrors,createOrder } from "../../actions/orderAction";
import { toast } from "react-toastify";

const Payment = () => {

   const navigate = useNavigate()
   const orderInfo = JSON.parse(sessionStorage.getItem("orderInfo"));

   const dispatch = useDispatch();
   //   const alert = useAlert();
   const stripe = useStripe();
   const elements = useElements();
   const payBtn = useRef(null);

   const { shippingInfo, cartItems } = useSelector((state) => state.cart);
   const { user } = useSelector((state) => state.user);
   const { error } = useSelector((state) => state.newOrder);
   
   const PORT ="https://northeast-electronics-hub-backend.vercel.app"

   const paymentData = {
      amount: Math.round(orderInfo.totalPrice * 100),
   };

   const order = {
      shippingInfo,
      orderItems: cartItems,
      itemPrice: orderInfo.subtotal,
      taxPrice: orderInfo.tax,
      shippingPrice: orderInfo.shippingCharges,
      totalPrice: orderInfo.totalPrice,
   };

   const submitHandler = async (e) => {
      e.preventDefault();

      payBtn.current.disabled = true;

      try {
         const config = { headers: { "Content-Type": "application/json", }, };
         const { data } = await axios.post(`${PORT}/api/v1/payment/process`, paymentData, config);

         const client_secret = data.client_secret;

         if (!stripe || !elements) return;

         const result = await stripe.confirmCardPayment(client_secret, {
            payment_method: {
               card: elements.getElement(CardNumberElement),
               billing_details: {
                  name: user.name,
                  email: user.email,
                  address: {
                     line1: shippingInfo.address,
                     city: shippingInfo.city,
                     state: shippingInfo.state,
                     postal_code: shippingInfo.pinCode,
                     country: shippingInfo.country,
                  },
               },
            },
         });

         if (result.error) {
            payBtn.current.disabled = false;
            toast.error(error, {
               position: "top-center",
               autoClose: 4000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
               progress: undefined,
               theme: "colored",
               });

         } else {
            if (result.paymentIntent.status === "succeeded") {
               order.paymentInfo = {
                  id: result.paymentIntent.id,
                  status: result.paymentIntent.status,
               };

                dispatch(createOrder(order));

               navigate("/order/success");
            } else {
               toast.success("Payment Successful", {
                  position: "top-center",
                  autoClose: 4000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                  });
            }
         }
      } catch (error) {
         payBtn.current.disabled = false;
         toast.error(error.response.data.message, {
            position: "top-center",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            });
         // alert.error(error.response.data.message);
      }
   };

   useEffect(() => {
      if (error) {
         toast.error(error, {
            position: "top-center",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            });
         dispatch(clearErrors());
      }
   }, [dispatch,error]);

   return (
      <Fragment>
         <MetaData title="Payment" />
         <CheckoutSteps activeStep={2} />
         <div className="paymentContainer">
            <form className="paymentForm" onSubmit={(e) => submitHandler(e)}>
               <Typography>Card Info</Typography>
               <div>
                  <CreditCardIcon />
                  <CardNumberElement className="paymentInput" />
               </div>
               <div>
                  <EventIcon />
                  <CardExpiryElement className="paymentInput" />
               </div>
               <div>
                  <VpnKeyIcon />
                  <CardCvcElement className="paymentInput" />
               </div>

               <input
                  type="submit"
                  value={`Pay - ₹${orderInfo && orderInfo.totalPrice}`}
                  ref={payBtn}
                  className="paymentFormBtn"
               />
            </form>
         </div>
      </Fragment>
   );
};

export default Payment;

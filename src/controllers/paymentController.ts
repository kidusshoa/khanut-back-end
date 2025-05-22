import { Chapa } from "chapa-nodejs";
import { AuthRequest } from "../middleware/auth";
import { Request, Response } from "express";
import {User} from "../models/user"
import axios from "axios"
import { Appointment } from "../models/appointment";


const chapa = new Chapa({
  secretKey: process.env.CHAPA_SECRET_KEY!,
});

export const payAppointment = async (req: AuthRequest, res: Response)=>{
try{
  const txRef = await chapa.genTxRef();
  const appointmentId = req.params.appointmentId;

  const appointment = await Appointment.findById(appointmentId) 
  if (!appointment){
    return res.status(404).json({ message: "Appointment not found" });
  }
  appointment.txRef = txRef;
  await appointment.save();

  const user = await User.findById(req.user?.id);
  
  const [firstName, lastName] = user?.name.split(" ") || [];

const {data:response} = await axios.post("https://api.chapa.co/v1/transaction/initialize", {
  "amount": appointment.price.toString(),
  "currency": "ETB",
  "first_name": firstName,
  "last_name": lastName,
  "tx_ref": txRef,
  
}, {
  headers: {
    "Authorization": `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
})
  return res.status(200).json({checkoutUrl: response.data.checkout_url} )
 

}catch(error:any){
 
  return res.status(500).json({ message: "Payment initialization failed" , error: error.message});

}

}

export const webHook = async (req: Request, res: Response)=>{
    try{const body = req.body as any
    const appointment = await Appointment.findOne({txRef:body.tx_ref})
    if(!appointment){
      return res.status(404).json({ message: "Appointment not found" });
    }
    appointment.paymentStatus = "paid"
    await appointment.save() ;

    return res.status(200).json({ message: "Payment successful" });
  }catch(error:any){
   
    return res.status(500).json({ message: "Payment failed" , error: error.message});
  }
}
   
 


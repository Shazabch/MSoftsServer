const mongoose = require("mongoose");
const inquirySchema = new mongoose.Schema({
 email:{type:String,required:true},
 startDate:{type:Date,required:true},
 details:{type:String,required:true},
 selectedservice: { type: String, required: true },
 deliveryoption: { type: String, required: true },
 totalcost: { type: Number, required: true },
 
});


module.exports = mongoose.model("Inquiry", inquirySchema);
/**
 * System and 3rd party libs
 */
const mongoose = require('mongoose');
const validator = require('validator'); 
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt=require('bcryptjs');

/**
 * User Schema
 */

var UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        minlength: 4,
        trim: true
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        trim: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email.'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,

    },
    address:{
        type: String,
        default: null
    },
    phone:{
        type:Number,
        required:true
    },
    photo:{ 
        type:String,
        default:null
    },
    tokens:
    [{
        access:{
            type:String,
            default:null,
            required:true
        },
        token:{
            type:String,
            default:null,
            required:true
        }
    }]
})

UserSchema.methods.toJSON  = function (){
    var user = this;
    var userObject= user.toObject();
    return _.pick(userObject,['_id','email']);
};

UserSchema.methods.generateAuthToken = function(){
    var user = this;
    var access = 'auth';
    var token =  jwt.sign({_id : user._id.toString(),access},'abc123');
    user.tokens.push({access,token});

   return user.save().then(()=>{
     return token;
   });
}

/*
    Find User Using
*/
UserSchema.statics.findByUser = function (token){
    var User =this;
    
    return User.findOne({'tokens.token':token}).then((user)=>{       
        if(!user)
        {
            return Promise.reject();
        }
            
            return Promise.resolve(user);
    });
    
 }

/*
    RemoveToken Or Logout
*/

UserSchema.methods.removeToken = function (token){
   var user = this;
   
   return user.update({
       $pull :{
           tokens :{token}
       }
   })
}

/*
    Authenticate The User
*/

UserSchema.statics.findByCredentials = function(email,password){
    var User =this;
    return User.findOne({email}).then((user)=>{
        if(!user)
        {
            return Promise.reject();
        }
        return new Promise((resolve,reject)=>{
            bcrypt.compare(password,user.password).then((res)=>{
                if(!res)
                {
                    reject();
                }
                    resolve(user);
            });
        });

    });
};

/*
    Find User Using Name For Secrch Functionality
*/
UserSchema.statics.findByName = function(name){
    var User =this;
    return User.findOne({name}).then((user)=>{
        if(!user)
        {
            return Promise.reject();
        }
            return Promise.resolve(user);
        });

};

/*
    Find a Token For Authenticate Middelware
*/
UserSchema.statics.findByToken = function(token) {
    var User = this;
    var decoded;
    try{
        decoded = jwt.verify(token,'abc123');
    }catch(e){
        return  Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token':token,
        'tokens.access':'auth'
    });
};

/*
    Generate Hash PassWord And Store
*/

UserSchema.pre('save', function(next){
    var user = this;
    if(user.isModified('password'))
    {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(user.password, salt, function(err, hash) {
                user.password=hash;
                next();
            });
        });
        
    }else
    {
        next();
    }
});








var User=mongoose.model('Users',UserSchema);


module.exports={User}
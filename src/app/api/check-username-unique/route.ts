import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import {z} from 'zod';
import { usernameValidation } from "@/schemas/signUpSchema";

const UsernameQuerySchema = z.object({
    username:usernameValidation
})

export async function GET(request: Request) {

    
     await dbConnect()

     try{
        const {searchParams} = new URL(request.url) 
        const queryParam = {
            username: searchParams.get("username")
        }
        const result = UsernameQuerySchema.parse(queryParam)
        console.log(result)
        const { username } = result

        const existingVerifiedUser = await  UserModel.findOne({username,isVerified:true})

        if(existingVerifiedUser){
            return Response.json({
                success:false,
                message:"Username already exists"
                },{status:400})
            }

            return Response.json(
                {
                    success:true,
                    message:'Username is unique' 
                },{status:400})
             
     }catch(error){
        console.log("Error checking username",error)
        return Response.json(
            {
                success:false,
                message:"Error checking username"
            },
            {
                status:500
            }
        )
     }
}
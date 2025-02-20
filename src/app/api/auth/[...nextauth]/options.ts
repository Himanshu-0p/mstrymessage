import {NextAuthOptions} from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/model/User";
import dbConnect from '@/lib/dbConnect';

export const authOptions: NextAuthOptions = {
     providers:[    
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text"},
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials:any):Promise<any>{
                await dbConnect()
                try{
                    const user = await UserModel.findOne({
                        $or: [
                            {email: credentials.identifier},
                            {username: credentials.identifier}
                        ]
                    })
                    if(!user){
                        throw new Error("No user found with this email or username")
                    }
                    const isPasswordCorrect = await bcrypt.compare(credentials.password as string, user.password as string)
                    if(isPasswordCorrect){
                        return user
                    }else{
                        throw new Error('Incorrect Password')
                    }
                }catch(err:any){
                    throw new Error(err.message)
                }
            }   
        }),
     ],
     callbacks:{
        async jwt ({token,user}){
            if(user){
                token._id = user._id?.toString()
                token.isVerified = user.isVerified
                token.isAcceptingMessage = user.isAcceptingMessage;
                token.username = user.username    
            }
            return token
        },
        async session({session,token}: { session: any, token: any }){
            if(token){
                session.user._id = token._id
                session.user.isVerified = token.isVerified
                session.user.isAcceptingMessage = token.isAcceptingMessage
                session.user.username = token.username
            }
            return session
        },
     },
     pages: {
        signIn: '/sign-in', // Ensure this is correctly pointing to the right route
    },
     session: {
        strategy: 'jwt',
     },
     secret: process.env.NEXTAUTH_SECRET,
}


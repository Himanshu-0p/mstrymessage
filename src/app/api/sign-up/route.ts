import dbConnect from "@/lib/dbConnect";
import { NextApiRequest, NextApiResponse } from "next";
import UserModel from '@/model/User';
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    try {
        // ✅ Correctly parse the request body
        const body = await request.json();
        const { username, email, password } = body;

        console.log("Parsed request body:", body); // Debugging

        // ✅ Check if all required fields are provided
        if (!username || !email || !password) {
            return Response.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        // ✅ Check if username is already taken by a verified user
        const existingUserVerifiedByUsername = await UserModel.findOne({
            username,
            isVerified: true,
        });

        if (existingUserVerifiedByUsername) {
            return Response.json(
                { success: false, message: "Username already exists" },
                { status: 400 }
            );
        }

        // ✅ Check if email is already registered
        const existingUserByEmail = await UserModel.findOne({ email });
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return Response.json(
                    { success: false, message: "Email already exists" },
                    { status: 400 }
                );
            } else {
                // ✅ Update existing unverified user
                const hashedPassword = await bcrypt.hash(password, 10);
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verifyCode = verifyCode;
                existingUserByEmail.verifyCodeExpire = new Date();
                await existingUserByEmail.save();
            }
        } else {
            // ✅ Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);

            // ✅ Create new user
            const newUser = new UserModel({
                username,
                email,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpire: expiryDate,
                isVerified: false,
                isAcceptingMessage: true,
                messages: [],
            });

            await newUser.save();
        }

        // ✅ Send verification email
        const emailResponse = await sendVerificationEmail(email, username, verifyCode);

        if (!emailResponse.success) {
            return Response.json(
                { success: false, message: "Error sending verification email" },
                { status: 500 }
            );
        }

        return Response.json(
            { success: true, message: "User created successfully" },
            { status: 201 }
        );

    } catch (err) {
        console.error("Error signing up", err);
        return Response.json(
            { success: false, message: "Error signing up" },
            { status: 500 }
        );
    }
}

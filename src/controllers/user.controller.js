import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {


    const { fullName, email, username, password } = req.body;
    console.log("email: ", email);

    if (fullName === "") {
        throw new ApiError(400, "fullname is required");
    }

    if (
        [fullName, email, username, password].some((field) => field?.trim === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "user with email already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLoaclPath = req.files?.coverImage[0]?.path;

    let coverImageLoaclPath;
    if(req.files && Array.isArray(req.files.coverImage) && registerUser.files.coverImage.length>0){
        coverImageLoaclPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLoaclPath);
    if(!avatar){
        throw new ApiError(400, "avatar is required");
    }

   const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password, 
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "something went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})
 
export { registerUser }
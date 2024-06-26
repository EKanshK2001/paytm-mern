import { Request, Response } from "express";
import { updateUserSchema} from "../types";
import { Account, User } from "../db";
import { hashSync } from "bcryptjs";

export const updateUser = async (req: Request, res: Response) => {
  // validate update body via zod
  const { success } = updateUserSchema.safeParse(req.body);

  if (!success) {
    res.status(411).json({
      msg: "inputs are too small",
    });
    return;
  }

  // update it in mdb using its update query

  try {
    const { password } = req.body;

    if (password) {
      const hashPass = hashSync(password, 10);
      const updateBody = { ...req.body, password: hashPass };
      await User.updateOne({ _id: res.locals.userId }, updateBody);
    } else {
      await User.updateOne({ _id: res.locals.userId }, req.body);
    }

    res.json({
      msg: "user info updated successfully",
    });
    return;
  } catch (error) {
    console.log(
      "im the error you see when trying to edit user information to db",
      error
    );
    return;
  }
};

export const getUser = async (req: Request, res: Response) => {
  // update it in mdb using its update query

  try {
    const user = await User.findById(res.locals.userId)

    if (!user) {
      res.status(401).json({
        msg: "unauthorized"
      })
      return;
    }

    const {username, firstName, lastName, _id} = user;

    res.json({
      user : {
        username, firstName, lastName, userId: _id
      }
    });

    return;

  } catch (error) {
    console.log(
      "im the error you see when trying to edit user information to db",
      error
    );
    return;
  }
};

export const findUsers = async (req: Request, res: Response) => {
  const filter = req.query.filter || ""; //if query has a filter or else no filter is assigned

  try {
    const users = await User.find({
      $or: [
        {
          firstName: {
            $regex: filter,
          },
        },
        {
          lastName: {
            $regex: filter,
          },
        },
      ],
    });

    res.json({
      users: users.map((user) => ({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        userId: user._id,
      })),
    });
  } catch (error) {
    console.log("im the error u see when fetching queried users", error);
    return;
  }
};


export const deleteUser = async (req: Request, res: Response) => {

  try {
    const user = await User.findByIdAndDelete(res.locals.userId);
    
    const account = await Account.findOneAndDelete({userId: res.locals.userId});

    if (user && account) {
      res.status(200).json({
        msg: "account deleted successfully"
      })
    } else {
      res.status(403).json({
        msg: "no user or account connected to user found"
      })
    }

  } catch (error) {
    console.log("im the error u see at deleting account", error)
    res.json({
      msg: "something went wrong"
    })
  }
}

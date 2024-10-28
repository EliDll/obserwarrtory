import { NextFunction, Request, Response } from 'express';

const serverHealthCheck = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: [
  {
    id: "Drivetrain",
    children: [
      {
        id: "Steering Motors",
        children: [
          {id: "front_l_steering"},
          {id: "front_r_steering"},
          {id: "mid_l_steering"},
          {id: "mid_r_steering"},
          {id: "rear_l_steering"},
          {id: "rear_r_steering"},
        ]
      },
      {
        id: "Driving Motors",
        children: [
          {id: "front_l_driving"},
          {id: "front_r_driving"},
          {id: "mid_l_driving"},
          {id: "mid_r_driving"},
          {id: "rear_l_driving"},
          {id: "rear_r_driving"},
        ]
      }
    ]
  },
  {
    id: "Payload",
    children: [
      {id: "pl_tilt"},
      {id: "pl_horizontal"},
      {id: "pl_vertical"}
    ]
  }
]
    });
};

export default { serverHealthCheck };

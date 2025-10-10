// /pages/api/checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { amount, description } = req.body;

  const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64"),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          cancel_url: "http://localhost:3000/cancel",
          success_url: "http://localhost:3000/success",
          line_items: [
            {
              name: description,
              amount: amount * 100, // in centavos
              currency: "PHP",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "card", "paymaya"],
        },
      },
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}

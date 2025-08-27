import express from "express";
import Team from "../models/Team.js";

const router = express.Router();

/**
 * POST /api/cashfree/create-order
 * Body: { teamName }
 * Returns: { ok, orderId, orderToken } // placeholders
 */
router.post("/create-order", async (req, res) => {
  try {
    const { teamName } = req.body;
    const team = await Team.findOne({ teamName });
    if (!team) return res.status(404).json({ ok: false, message: "Team not found" });
    if (team.paymentStatus === "paid") return res.json({ ok: true, message: "Already paid" });

    // TODO: Call Cashfree Create Order API here using APP_ID/SECRET
    // For now, return placeholders so frontend flow remains intact.
    const fakeOrderId = "CF_TEST_ORDER_" + Date.now();
    const fakeOrderToken = "TOKEN_" + Date.now();

    // Save ref
    team.paymentRef = fakeOrderId;
    await team.save();

    return res.json({
      ok: true,
      orderId: fakeOrderId,
      orderToken: fakeOrderToken,
      amount: 2899
    });
  } catch (e) {
    console.error("Cashfree order error:", e);
    return res.status(500).json({ ok: false, message: "Order create failed" });
  }
});

/**
 * POST /api/cashfree/webhook
 * Cashfree will POST here on payment success
 * Verify signature -> set team.paymentStatus = "paid" where paymentRef = orderId
 */
router.post("/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    // TODO: verify signature from Cashfree headers & body
    // const signature = req.headers["x-webhook-signature"];
    // verify with CASHFREE_SECRET_KEY

    // After verification, parse:
    // const { orderId, orderStatus, orderAmount } = parsedPayload;

    // Placeholder simulate:
    const parsed = JSON.parse(req.body.toString() || "{}");
    const { orderId, orderStatus } = parsed;

    if (orderStatus === "PAID" || orderStatus === "SUCCESS") {
      const team = await Team.findOneAndUpdate(
        { paymentRef: orderId },
        { paymentStatus: "paid" },
        { new: true }
      );

      if (team) {
        console.log(`✅ Payment marked paid for ${team.teamName}`);
        return res.status(200).send("OK");
      }
    }

    return res.status(200).send("IGNORED");
  } catch (e) {
    console.error("Webhook error:", e);
    return res.status(200).send("OK"); // respond 200 to avoid retries storm; log the error
  }
});

export default router;
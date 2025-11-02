import AppleIcon from "@/components/AppleIcon";
import "./pricing.scss";

export default function PricingPage() {
  return (
    <section className="pricing">
      <div className="pricing-title-wrapper">
        <h1 className="pricing-title">Clipboard history</h1>
        <h1 className="pricing-title">for the price of a coffee</h1>
      </div>

      <div className="pricing-card">
        <div className="pricing-icon">
          <AppleIcon size={56} />
        </div>
        <h2
          style={{
            fontSize: "28px",
          }}
        >
          Available on Mac
        </h2>
        <p
          className="pricing-subtext"
          style={{
            fontSize: "14px",
            marginTop: "6px",
          }}
        >
          Each device requires a subscription
        </p>

        <hr />

        <div className="pricing-price">
          <strong>$2/month</strong>
          <span
            style={{
              marginTop: "8px",
            }}
          >
            Cancel at any time
          </span>
        </div>

        <button className="subscribe-button">Try for free</button>
      </div>

      <p className="pricing-note">
        Prices are in USD excluding VAT and can vary across different countries
        and regions.
      </p>
    </section>
  );
}

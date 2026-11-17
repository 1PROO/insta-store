# Storefront Acceptance Checklist (`الاستلام`)

Written **before** building `/shop`, `/c/[slug]`, `/p/[slug]`, and `/checkout`.

## 1. Functional Requirements (Must Do)

- [ ] All prices, coupon discounts, and shipping fees are computed strictly on the server (client prices ignored).
- [ ] `/p/[slug]` updates live price and stock state when switching Size and Color `variant`s, and disables out-of-stock variants clearly.
- [ ] Cart drawer persists across pages and updates header `#headerCartCount` immediately.
- [ ] `/checkout` normalizes Egyptian mobile numbers (`01xxxxxxxxx` / `+201xxxxxxxxx`), validates `shipping_zone`, applies/removes `coupon`, and creates an order reference with WhatsApp handoff.

## 2. Negative Requirements (Must NOT Do)

- [ ] Zero third-party network calls on page load unless pixels/external video URLs are configured.
- [ ] Never allow ordering quantity `<= 0`, quantity `> 10` per variant, or quantity exceeding live stock.
- [ ] Never accept duplicate checkout submission with the same `idempotency_key`.

## 3. Edge Cases (The 3 Commonly Forgotten Checks)

- [ ] **Empty State:** On `/p/[slug]`, if `fabricCare` is null, hide the Fabric Care accordion; if neither product nor store `sizeGuide` is set, hide the Size Guide trigger. On `/shop`, show a clean clear-filters CTA when 0 items match.
- [ ] **Long Text:** Product descriptions > 180 chars truncate with an accessible "اقرأ المزيد / Read more" toggle.
- [ ] **Mobile & RTL (`375px`):** Sticky mobile Add-to-Cart bar never overlaps footer or horizontal overflows; RTL/LTR toggle works cleanly on every page.

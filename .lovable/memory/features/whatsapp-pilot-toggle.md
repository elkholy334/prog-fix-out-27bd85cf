---
name: WhatsApp Pilot Toggle
description: When pilotEnabled=false the app skips the Whats360 API and opens wa.me directly with prefilled message instead.
type: feature
---
`whatsapp_config.pilotEnabled` (default true) controls all WhatsApp sends. When false, `SendWhatsAppDialog` and any auto-send paths must call `openWhatsAppDirect(phone, message)` from `@/lib/whatsapp` which opens `https://wa.me/<intl-phone>?text=...`. Connection probe in `testWhatsAppConnection` now sends a REAL message to the account's own phone (`acc.phone` is required) — empty jid no longer used.

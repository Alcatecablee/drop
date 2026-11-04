# OriginIndex Technical Verification Record: QuickBridge

**Verification ID**: `QB-VERIFY-20261103-01`  
**Target Product**: QuickBridge (`https://quickbridge.app`)  
**Publisher Affiliation**: Developed by Clive Makazhu (Publisher & Editor of OriginIndex)  
**Verification Date**: 2026-11-03  
**Verified By**: Clive Makazhu  
**Classification**: Global Web Service (Reference Implementation)

---

## 1. Test Session Environment & Telemetry

| Parameter | Sending Endpoint | Receiving Endpoint |
| :--- | :--- | :--- |
| **Device Hardware** | Apple MacBook Pro (Apple M2 Pro) | Apple iPhone 14 Pro |
| **Operating System** | macOS Sonoma 14.1 | iOS 17.1 |
| **Browser Version** | Google Chrome 120.0.6099.129 | Apple Safari 17.1 (WebKit 19616.2.9.11.7) |
| **Network Type** | Asymmetrical Fiber-to-the-Home (FTTH) | Mobile Cellular 4G LTE (Vodacom South Africa) |
| **NAT Topology** | Full-Cone NAT | Carrier-Grade NAT (CGNAT) / Symmetric |

---

## 2. Test Asset & Cryptographic Verification

- **Payload Identifier**: `sample-payload-250mb.tar.gz`
- **Payload Size**: 262,144,000 bytes (250.0 MB)
- **Source SHA-256**: `7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`
- **Received SHA-256**: `7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`
- **Integrity Result**: **PASS** (Cryptographic match confirmed across endpoints).
- **Supporting Raw Output**: See [`tests/verification/artifacts/hash-verification-output.txt`](./artifacts/hash-verification-output.txt).

---

## 3. WebRTC / ICE Candidate Negotiation Log

ICE gathering and candidate selection followed the Interactive Connectivity Establishment framework (RFC 8445):

```json
{
  "session_id": "QB-VERIFY-20261103-01",
  "timestamp": "2026-11-03T14:22:18Z",
  "ice_candidates_gathered": {
    "sender_chrome": [
      { "type": "host", "protocol": "udp", "ip": "192.168.1.105", "port": 58432 },
      { "type": "srflx", "protocol": "udp", "ip": "102.132.x.x", "port": 58432, "related_address": "192.168.1.105" }
    ],
    "receiver_safari": [
      { "type": "host", "protocol": "udp", "ip": "10.x.x.x", "port": 51234 },
      { "type": "srflx", "protocol": "udp", "ip": "197.x.x.x", "port": 51234, "related_address": "10.x.x.x" },
      { "type": "relay", "protocol": "udp", "ip": "turn.quickbridge.app", "port": 3478 }
    ]
  },
  "selected_candidate_pair": {
    "local_candidate": "srflx (102.132.x.x:58432)",
    "remote_candidate": "relay (turn.quickbridge.app:3478)",
    "ice_state": "completed",
    "dtls_state": "connected",
    "sctp_state": "open",
    "selected_transport": "TURN Relay (RFC 8656) due to carrier-grade symmetric NAT on mobile cellular endpoint"
  },
  "transfer_metrics": {
    "duration_seconds": 48.2,
    "effective_throughput_mbps": 43.51,
    "packets_sent": 16428,
    "retransmissions": 14
  }
}
```

*Raw WebRTC Telemetry*: See [`tests/verification/artifacts/webrtc-getstats-report.json`](./artifacts/webrtc-getstats-report.json) for the full `peerConnection.getStats()` candidate-pair and transport report.

---

## 4. Client-Side Network Inspection & Storage Audit

During active file transfer on Google Chrome 120 (macOS), network requests were inspected via DevTools:
1. **Signaling Endpoint**: WebSocket traffic observed strictly to `wss://quickbridge.app/ws` for Session Description Protocol (SDP) and ICE candidate exchange. No payload bytes traversed the WebSocket signaling channel.
2. **Data Streaming**: Encrypted SCTP packet chunks streamed via WebRTC `RTCDataChannel` to the selected TURN relay IP.
3. **Absence of Cloud Object Storage**: Zero intermediate HTTP `POST` or `PUT` requests to cloud object storage endpoints (such as AWS S3, Cloudflare R2, Google Cloud Storage, or Azure Blob Storage) were initiated by the client.
4. **Account & Credential Gating**: Zero account registration prompts, phone number gates, or credit card collection forms were presented.

*Network Request Summary*: See [`tests/verification/artifacts/devtools-network-summary.json`](./artifacts/devtools-network-summary.json).

---

## 5. Scope & Audit Limitations

- **Empirically Verified Scope**:
  - A 250 MB sample transfer was executed and verified on 2026-11-03 between Chrome 120 (macOS) and Safari 17.1 (iOS).
  - The connection utilized a **TURN-relayed candidate pair** due to mobile cellular symmetric CGNAT. It was **not** a direct host-to-host or local LAN path.
  - Client-side network inspection confirmed direct SCTP data channel routing without client-side object-storage uploads.
- **Builder-Supplied Specification**:
  - The stated 10 GB file capacity limit is a builder specification based on client-side memory chunking and stream auto-save; OriginIndex has not stress-tested a full 10 GB transfer session.
- **Untested Boundaries & Limitations**:
  - Full packet captures (PCAP) were not archived; only transport-layer statistics (`getStats()`) and HTTP/WebSocket network traces were recorded.
  - OriginIndex has not performed a formal third-party cryptographic code audit of the WebRTC DTLS/SCTP implementation.
  - OriginIndex has not inspected server-side operating logs on the `turn.quickbridge.app` relay host; protocol encryption alone does not prove that relay hosts maintain zero operational logging.
- **Publisher Relationship**:
  - QuickBridge is developed by Clive Makazhu, Publisher and Editor of OriginIndex. This relationship is permanently disclosed across all OriginIndex listings.

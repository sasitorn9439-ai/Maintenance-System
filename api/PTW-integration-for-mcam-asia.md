# EHS Portal → mcam.asia Work Permit System: Integration Guide

**Purpose:** show the Permit to Work requests created in the MCAM EHS Portal (https://maintenance-system-lac.vercel.app/ehs.html) inside the mcam.asia Work Permit System.
**Owner of the data:** MCAM EHS. Read-only for mcam.asia; mcam.asia does not need to write anything back.

There are two options. Option A needs about 10 minutes of work; Option B gives full control over the display.

---

## Option A: Embed the ready-made Permit Board (no backend work)

Add a menu item or page in mcam.asia that contains:

```html
<iframe src="https://maintenance-system-lac.vercel.app/ptw-board.html?embed=1&lang=en"
        style="width:100%;height:820px;border:0" title="EHS Portal Permit Board"></iframe>
```

- Read-only live board: Active / Pending / Overdue / Closed today counters, searchable table.
- Refreshes every 60 seconds by itself.
- Optional `&tab=pending` (or `active`, `closed`, `all`) to open on a given tab.
- `&lang=en` or `&lang=th` sets the language. Viewers can also switch with the TH / EN button; their choice is remembered.
- Follows the viewer's light/dark setting.

## Option B: Read the JSON API and render in mcam.asia's own UI

```
GET https://maintenance-system-lac.vercel.app/api/permits?status=active
Header: x-api-key: <key provided by MCAM EHS>
```

| Query | Values | Default |
|---|---|---|
| `status` | `active` (approved + closing), `pending`, `closed`, `all` | `active` |
| `since` | ISO date; permits starting on/after this date | none |
| `limit` | 1–500 | 100 |

CORS is open to `https://mcam.asia` only. Responses are cached for 30 seconds.

**Response**

```json
{
  "count": 1,
  "generated_at": "2026-10-28T10:30:00.000Z",
  "permits": [{
    "permit_no": "HW-2026-0007",
    "id": "uuid",
    "type": "hot", "type_code": "HW", "form_no": "14-2045-TH",
    "type_name_en": "Hot Work Permit", "type_name_th": "ใบขออนุญาตงานที่มีความร้อนและประกายไฟ",
    "status": "approved",
    "area": "Factory 2", "location": "Extruder #3", "description": "เชื่อมท่อ steam line",
    "company": "ABC Engineering", "requester": "สมชาย ใจดี", "requester_tel": "081…",
    "supervisor": "สมศักดิ์ รักงาน", "workers": 3, "ref_jsea": "",
    "start_at": "2026-10-28T01:00:00Z", "end_at": "2026-10-28T10:00:00Z", "expired": false,
    "approved_by": "EHS", "area_owner": "Production", "approved_at": "…",
    "closed_by": null, "closed_at": null,
    "photos": [{ "url": "https://…jpg", "taken_at": "…" }],
    "created_at": "…", "updated_at": "…",
    "view_url": "https://maintenance-system-lac.vercel.app/ehs.html#ptw"
  }]
}
```

**Types:** `daily` (DW, 14-2046-TH), `hot` (HW, 14-2045-TH), `wah` (WAH, 14-2044-TH), `loto` (LOTO, 14-2043-TH), `cs` (CS, confined space).
**Statuses:** `pending` → `approved` → `closing` → `closed`; also `rejected`, `cancelled`.
All times are UTC (ISO 8601); display in Asia/Bangkok.

**Errors:** `401 invalid_api_key`, `405 method_not_allowed`, `502 upstream_error`.

---

## Setup on the EHS Portal side (done by MCAM EHS)

In Vercel → project `maintenance-system` → Settings → Environment Variables:

| Name | Value |
|---|---|
| `PTW_API_KEY` | a long random string; give it to the mcam.asia developer privately |
| `PTW_ALLOWED_ORIGIN` | `https://mcam.asia` (default if not set) |

Redeploy after adding the variables.

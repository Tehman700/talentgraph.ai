"""
hiring.py — Hiring forms, candidate connections, and CSV export.

Routes:
  POST /api/hiring/forms                      Create + send a hiring form
  GET  /api/hiring/forms                      List org's forms
  GET  /api/hiring/forms/{form_id}            Get form detail
  POST /api/hiring/forms/{form_id}/respond    Candidate submits a response
  GET  /api/hiring/forms/{form_id}/responses  Org retrieves responses
  GET  /api/hiring/forms/{form_id}/export.csv Download responses as CSV
  POST /api/connections/request               Send a connection request
  GET  /api/connections                       List connections for current user
  PATCH /api/connections/{conn_id}            Accept or reject a connection
"""

import csv
import io
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Response, Query
from ..auth import get_current_user, get_optional_user
from ..database import get_db

router = APIRouter(tags=["hiring"])


# ─────────────────────────────────────────────────────────────────────────────
# Hiring forms
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/hiring/forms", status_code=201)
async def create_hiring_form(payload: dict, user=Depends(get_current_user), db=Depends(get_db)):
    """
    Create a hiring form and send notifications to target candidates.
    Expected payload:
      { job_title, job_description, company, deadline?,
        questions: [{ id, text, type, options, required }],
        target_user_ids: [uuid, ...] }
    """
    if not payload.get("job_title"):
        raise HTTPException(status_code=422, detail="job_title is required")

    form_id = str(uuid.uuid4())
    now     = datetime.now(timezone.utc).isoformat()

    form_row = {
        "id":              form_id,
        "created_by":      str(user.id),
        "job_title":       payload.get("job_title", ""),
        "job_description": payload.get("job_description", ""),
        "company":         payload.get("company", ""),
        "deadline":        payload.get("deadline"),
        "questions":       json.dumps(payload.get("questions", [])),
        "created_at":      now,
        "status":          "active",
    }

    # Attempt DB insert (table may not exist yet in early-stage project)
    try:
        db.table("hiring_forms").insert(form_row).execute()
    except Exception as e:
        if "does not exist" in str(e).lower() or "PGRST205" in str(e):
            # Return a synthetic success so the frontend still works
            return {
                "form_id":        form_id,
                "notified_count": 0,
                "note":           "DB table 'hiring_forms' not yet created. Run the migration SQL to persist forms.",
            }
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    # Notify each target candidate by inserting a notification row
    target_ids    = payload.get("target_user_ids", [])
    notified_count = 0
    for uid in target_ids:
        try:
            # Check if user exists on our talent table (best-effort)
            # if we wanted to be strict we'd check auth.users or our own talent_points
            db.table("form_notifications").insert({
                "id":       str(uuid.uuid4()),
                "form_id":  form_id,
                "user_id":  str(uid),
                "status":   "pending",
                "sent_at":  now,
            }).execute()
            notified_count += 1
        except Exception as e:
            # Log error if needed, but continue for other candidates
            print(f"Failed to notify {uid}: {e}")

    return {"form_id": form_id, "notified_count": notified_count}


@router.get("/api/hiring/forms")
async def list_hiring_forms(user=Depends(get_current_user), db=Depends(get_db)):
    """Return all hiring forms created by the current org user."""
    try:
        result = (
            db.table("hiring_forms")
            .select("id, job_title, company, created_at, status, deadline")
            .eq("created_by", str(user.id))
            .order("created_at", desc=True)
            .execute()
        )
        # Enrich each form with response counts
        forms = result.data or []
        for form in forms:
            try:
                cnt = (
                    db.table("form_responses")
                    .select("id", count="exact")
                    .eq("form_id", form["id"])
                    .execute()
                )
                form["response_count"] = cnt.count or 0
            except Exception:
                form["response_count"] = 0
        return {"forms": forms}
    except Exception as e:
        if "does not exist" in str(e).lower() or "PGRST205" in str(e):
            return {"forms": []}
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/hiring/forms/{form_id}")
async def get_hiring_form(form_id: str, user=Depends(get_optional_user), db=Depends(get_db)):
    """Return full form detail including questions (for candidate to fill out)."""
    try:
        result = (
            db.table("hiring_forms")
            .select("*")
            .eq("id", form_id)
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Form not found")
        form = result.data
        # Parse questions JSON
        if isinstance(form.get("questions"), str):
            form["questions"] = json.loads(form["questions"])
        return form
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Form not found")


@router.post("/api/hiring/forms/{form_id}/respond", status_code=201)
async def submit_form_response(
    form_id: str,
    payload: dict,
    user=Depends(get_optional_user),
    db=Depends(get_db),
):
    """
    Candidate submits their answers to a hiring form.
    Expected payload: { answers: [{ question_id, answer }], candidate_name?, candidate_email? }
    """
    response_id = str(uuid.uuid4())
    row = {
        "id":              response_id,
        "form_id":         form_id,
        "user_id":         str(user.id) if user else None,
        "candidate_name":  payload.get("candidate_name", ""),
        "candidate_email": payload.get("candidate_email", ""),
        "answers":         json.dumps(payload.get("answers", [])),
        "submitted_at":    datetime.now(timezone.utc).isoformat(),
    }
    try:
        db.table("form_responses").insert(row).execute()
        # Mark notification as responded
        if user:
            db.table("form_notifications").update({"status": "responded"}).eq("form_id", form_id).eq("user_id", str(user.id)).execute()
    except Exception as e:
        if "does not exist" in str(e).lower():
            return {"response_id": response_id, "note": "DB table not yet created."}
        raise HTTPException(status_code=500, detail=str(e))

    return {"response_id": response_id, "submitted": True}


@router.get("/api/hiring/notifications")
async def list_notifications(user=Depends(get_current_user), db=Depends(get_db)):
    """List notifications for the current user (candidate)."""
    try:
        result = (
            db.table("form_notifications")
            .select("*, hiring_forms(job_title, company, status)")
            .eq("user_id", str(user.id))
            .order("sent_at", desc=True)
            .execute()
        )
        return {"notifications": result.data or []}
    except Exception as e:
        if "does not exist" in str(e).lower() or "PGRST205" in str(e):
            return {"notifications": []}
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/hiring/forms/{form_id}/responses")
async def get_form_responses(form_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Return all candidate responses for a form (org-only)."""
    # Verify ownership
    try:
        owner = db.table("hiring_forms").select("created_by").eq("id", form_id).single().execute()
        if not owner.data or owner.data["created_by"] != str(user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view these responses")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Form not found")

    try:
        result = db.table("form_responses").select("*").eq("form_id", form_id).order("submitted_at").execute()
        responses = result.data or []
        for r in responses:
            if isinstance(r.get("answers"), str):
                r["answers"] = json.loads(r["answers"])
        return {"responses": responses, "count": len(responses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/hiring/forms/{form_id}/export.csv")
async def export_form_responses_csv(form_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Download form responses as a CSV file (Excel-compatible)."""
    # Verify ownership
    try:
        owner = db.table("hiring_forms").select("created_by, job_title").eq("id", form_id).single().execute()
        if not owner.data or owner.data["created_by"] != str(user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
        job_title = owner.data.get("job_title", "form")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Form not found")

    try:
        result = db.table("form_responses").select("*").eq("form_id", form_id).order("submitted_at").execute()
        responses = result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    if not responses:
        writer.writerow(["No responses yet"])
    else:
        # Flatten answers for CSV columns
        all_q_ids: list[str] = []
        for r in responses:
            answers = r.get("answers", [])
            if isinstance(answers, str):
                answers = json.loads(answers)
            for a in answers:
                if a.get("question_id") not in all_q_ids:
                    all_q_ids.append(a["question_id"])

        headers = ["Candidate Name", "Email", "Submitted At"] + [f"Q: {qid}" for qid in all_q_ids]
        writer.writerow(headers)

        for r in responses:
            answers = r.get("answers", [])
            if isinstance(answers, str):
                answers = json.loads(answers)
            ans_map = {a["question_id"]: a.get("answer", "") for a in answers}
            row = [
                r.get("candidate_name", ""),
                r.get("candidate_email", ""),
                r.get("submitted_at", ""),
            ] + [ans_map.get(qid, "") for qid in all_q_ids]
            writer.writerow(row)

    csv_content = "﻿" + output.getvalue()  # BOM for Excel UTF-8
    safe_title  = "".join(c if c.isalnum() or c in "_ -" else "_" for c in job_title)[:40]

    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}_responses.csv"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Connections
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/connections/request", status_code=201)
async def send_connection_request(payload: dict, user=Depends(get_current_user), db=Depends(get_db)):
    """Send a connection request to another user."""
    target_id = payload.get("target_user_id")
    if not target_id:
        raise HTTPException(status_code=422, detail="target_user_id is required")
    if str(target_id) == str(user.id):
        raise HTTPException(status_code=422, detail="Cannot connect with yourself")

    conn_id = str(uuid.uuid4())
    row = {
        "id":           conn_id,
        "from_user_id": str(user.id),
        "to_user_id":   str(target_id),
        "message":      payload.get("message", ""),
        "status":       "pending",
        "created_at":   datetime.now(timezone.utc).isoformat(),
    }
    try:
        db.table("connections").insert(row).execute()
    except Exception as e:
        if "does not exist" in str(e).lower():
            return {"connection_id": conn_id, "note": "DB table not yet created."}
        raise HTTPException(status_code=500, detail=str(e))

    return {"connection_id": conn_id, "status": "pending"}


@router.get("/api/connections")
async def list_connections(
    status: str | None = Query(None, description="pending | accepted | rejected"),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Return all connections for the current user (sent or received)."""
    try:
        q = db.table("connections").select("*").or_(
            f"from_user_id.eq.{user.id},to_user_id.eq.{user.id}"
        )
        if status:
            q = q.eq("status", status)
        result = q.order("created_at", desc=True).execute()
        return {"connections": result.data or []}
    except Exception as e:
        if "does not exist" in str(e).lower():
            return {"connections": []}
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/connections/{conn_id}")
async def update_connection(conn_id: str, payload: dict, user=Depends(get_current_user), db=Depends(get_db)):
    """Accept or reject a connection request (recipient only)."""
    new_status = payload.get("status")
    if new_status not in ("accepted", "rejected"):
        raise HTTPException(status_code=422, detail="status must be 'accepted' or 'rejected'")

    try:
        result = (
            db.table("connections")
            .update({"status": new_status})
            .eq("id", conn_id)
            .eq("to_user_id", str(user.id))
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Connection not found or not authorized")
        return {"connection_id": conn_id, "status": new_status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

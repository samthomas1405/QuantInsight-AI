from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timezone
import json

from app.dependencies import get_db
from app.models import User, AnalysisHistory
from app.auth import get_current_user

router = APIRouter()

@router.post("/analysis-history")
async def save_analysis(
    analysis_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a completed analysis to user's history"""
    try:
        # User is already authenticated
        user = current_user
        
        # Check if analysis already exists
        existing = db.query(AnalysisHistory).filter(
            AnalysisHistory.analysis_id == analysis_data.get("analysis_id"),
            AnalysisHistory.user_id == user.id
        ).first()
        
        if existing:
            # Update existing analysis
            existing.results = analysis_data.get("results")
            existing.status = analysis_data.get("status", "completed")
            existing.completed_at = datetime.now(timezone.utc)
        else:
            # Create new analysis history entry
            new_analysis = AnalysisHistory(
                user_id=user.id,
                analysis_id=analysis_data.get("analysis_id"),
                tickers=analysis_data.get("tickers", []),
                analysis_type=analysis_data.get("analysis_type", "analyze"),
                results=analysis_data.get("results"),
                status=analysis_data.get("status", "completed"),
                completed_at=datetime.now(timezone.utc) if analysis_data.get("status") == "completed" else None
            )
            db.add(new_analysis)
        
        db.commit()
        
        # Clean up old analyses (keep only last 10)
        user_analyses = db.query(AnalysisHistory).filter(
            AnalysisHistory.user_id == user.id
        ).order_by(AnalysisHistory.created_at.desc()).all()
        
        if len(user_analyses) > 10:
            # Delete oldest analyses
            for analysis in user_analyses[10:]:
                db.delete(analysis)
            db.commit()
        
        return {"success": True, "message": "Analysis saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis-history")
async def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get user's analysis history"""
    try:
        # User is already authenticated
        user = current_user
        
        # Get user's analyses
        analyses = db.query(AnalysisHistory).filter(
            AnalysisHistory.user_id == user.id
        ).order_by(AnalysisHistory.created_at.desc()).limit(10).all()
        
        # Format response
        history = []
        for analysis in analyses:
            history.append({
                "id": analysis.analysis_id,
                "tickers": analysis.tickers,
                "analysis_type": getattr(analysis, 'analysis_type', 'analyze'),
                "results": analysis.results,
                "status": analysis.status,
                "startTime": analysis.created_at.isoformat() if analysis.created_at else None,
                "completedAt": analysis.completed_at.isoformat() if analysis.completed_at else None
            })
        
        return history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis-history/{analysis_id}")
async def get_analysis_by_id(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a specific analysis by ID"""
    try:
        # User is already authenticated
        user = current_user
        
        # Get the analysis
        analysis = db.query(AnalysisHistory).filter(
            AnalysisHistory.analysis_id == analysis_id,
            AnalysisHistory.user_id == user.id
        ).first()
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return {
            "id": analysis.analysis_id,
            "tickers": analysis.tickers,
            "analysis_type": getattr(analysis, 'analysis_type', 'analyze'),
            "results": analysis.results,
            "status": analysis.status,
            "startTime": analysis.created_at.isoformat() if analysis.created_at else None,
            "completedAt": analysis.completed_at.isoformat() if analysis.completed_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/analysis-history/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific analysis"""
    try:
        # User is already authenticated
        user = current_user
        
        # Get and delete the analysis
        analysis = db.query(AnalysisHistory).filter(
            AnalysisHistory.analysis_id == analysis_id,
            AnalysisHistory.user_id == user.id
        ).first()
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        db.delete(analysis)
        db.commit()
        
        return {"success": True, "message": "Analysis deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
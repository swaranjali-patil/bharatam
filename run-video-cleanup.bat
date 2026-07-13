@echo off
echo ============================================================
echo Video Fields Cleanup Script for bharatam_courses
echo ============================================================
echo.
echo This script will remove all fields from video documents
echo EXCEPT these 15 fields:
echo   - approvalStatus, approvedAt, bunnyVideoId, contentType
echo   - createdAt, durationMinutes, fileName, isFree
echo   - order, status, storageUrl, thumbnailUrl
echo   - title, updatedAt, views
echo.
echo ============================================================
echo.
pause
echo.
echo Starting cleanup...
echo.
node cleanup-video-fields.js
echo.
echo ============================================================
echo Cleanup completed! Check the output above for details.
echo ============================================================
echo.
pause

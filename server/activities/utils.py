from .models import Activity

def log_activity(activity_type, status, title, details=None):
    """
    Create an activity log entry
    """
    return Activity.objects.create(
        type=activity_type,
        status=status,
        title=title,
        details=details
    )
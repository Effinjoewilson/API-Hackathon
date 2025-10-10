from django.contrib import admin
from django.urls import path
from django.urls import include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/apis/", include("apis.urls")),
    path("api/databases/", include("databases.urls")),
    path("api/mappings/", include("mappings.urls")),
    path("api/activities/", include("activities.urls")),
]

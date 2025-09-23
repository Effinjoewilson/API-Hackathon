from django.urls import path
from .views import RegisterView, LoginView, LogoutView, CustomTokenRefreshView, CheckAuthView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("check-auth/", CheckAuthView.as_view(), name="check_auth"),
]

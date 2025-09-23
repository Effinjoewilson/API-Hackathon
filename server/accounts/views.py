from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.permissions import IsAuthenticated

class RegisterView(APIView):
    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        if not username or not password:
            return Response({"detail": "Username and password required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=email).exists():
            return Response({"detail": "User already exists."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=email, email=email, password=password)
        return Response({"detail": "User created successfully."}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        
        response = Response({"detail": "Login successful"})
        response.set_cookie(
            key='access_token',
            value=str(refresh.access_token),
            max_age=60 * 15,  # 15 minutes
            httponly=True,
            samesite='Lax',
            secure=False  # Set True in production with HTTPS
        )
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            max_age=60 * 60 * 24,  # 1 day
            httponly=True,
            samesite='Lax',
            secure=False  # Set True in production with HTTPS
        )
        return response

class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        
        response = Response({"detail": "Logout successful."})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response

class CustomTokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            refresh = RefreshToken(refresh_token)
            new_access = refresh.access_token
            
            response = Response({"detail": "Token refreshed"})
            response.set_cookie(
                key='access_token',
                value=str(new_access),
                max_age=60 * 15,  # 15 minutes
                httponly=True,
                samesite='Lax',
                secure=False  # Set True in production
            )
            return response
        except TokenError:
            return Response({"detail": "Invalid token."}, status=status.HTTP_401_UNAUTHORIZED)

class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({"authenticated": True})

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
import requests
import time
from .models import APIEndpoint, APITestLog
from .serializers import APIEndpointSerializer, APITestLogSerializer, APITestRequestSerializer

class APIEndpointViewSet(viewsets.ModelViewSet):
    serializer_class = APIEndpointSerializer
    permission_classes = [IsAuthenticated]

    '''def create(self, request, *args, **kwargs):
        print("📩 Raw POST Data:", request.data)   # debug here
        return super().create(request, *args, **kwargs)'''
    
    def get_queryset(self):
        """Filter APIs by owner and optional query params"""
        queryset = APIEndpoint.objects.filter(owner=self.request.user)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(endpoint_path__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by auth type
        auth_type = self.request.query_params.get('auth_type', None)
        if auth_type:
            queryset = queryset.filter(auth_type=auth_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test an API endpoint"""
        api_endpoint = self.get_object()
        '''serializer = APIEndpointSerializer(api_endpoint)
        print("🗄️ API data fetched from DB (serialized):")
        print(serializer.data)'''
        serializer = APITestRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        test_data = serializer.validated_data
        
        # Prepare request
        url = api_endpoint.get_full_url()
        headers = {**api_endpoint.headers, **test_data.get('headers', {})}
        params = {**api_endpoint.query_params, **test_data.get('params', {})}
        body = test_data.get('body', None)
        
        # Use body template if no body provided and method supports body
        if api_endpoint.http_method in ['POST', 'PUT', 'PATCH']:
            if body is None and api_endpoint.body_template:
                body = api_endpoint.body_template
        
        # Add authentication
        if api_endpoint.auth_type == 'api_key':
            api_key = api_endpoint.auth_credentials.get('api_key')
            key_location = api_endpoint.auth_credentials.get('key_location', 'header')
            key_name = api_endpoint.auth_credentials.get('key_name', 'X-API-Key')
            
            if key_location == 'header':
                headers[key_name] = api_key
            else:
                params[key_name] = api_key
                
        elif api_endpoint.auth_type == 'bearer':
            token = api_endpoint.auth_credentials.get('token')
            headers['Authorization'] = f'Bearer {token}'
        
        # Make request
        start_time = time.time()
        test_log = APITestLog(
            api_endpoint=api_endpoint,
            tested_by=request.user,
            request_headers=headers,
            request_params=params,
            request_body=body
        )
        
        try:
            # Handle different content types
            if api_endpoint.http_method in ['POST', 'PUT', 'PATCH']:
                # Set content type header if not already set
                if 'Content-Type' not in headers:
                    headers['Content-Type'] = api_endpoint.content_type
                
                if api_endpoint.content_type == 'application/json':
                    response = requests.request(
                        method=api_endpoint.http_method,
                        url=url,
                        headers=headers,
                        params=params,
                        json=body,  # Send as JSON
                        timeout=30
                    )
                elif api_endpoint.content_type == 'application/x-www-form-urlencoded':
                    response = requests.request(
                        method=api_endpoint.http_method,
                        url=url,
                        headers=headers,
                        params=params,
                        data=body,  # Send as form data
                        timeout=30
                    )
                elif api_endpoint.content_type == 'multipart/form-data':
                    # Remove Content-Type header for multipart (requests will set it with boundary)
                    headers.pop('Content-Type', None)
                    response = requests.request(
                        method=api_endpoint.http_method,
                        url=url,
                        headers=headers,
                        params=params,
                        files=body if isinstance(body, dict) else None,
                        timeout=30
                    )
                elif api_endpoint.content_type == 'application/xml':
                    response = requests.request(
                        method=api_endpoint.http_method,
                        url=url,
                        headers=headers,
                        params=params,
                        data=body if isinstance(body, str) else str(body),
                        timeout=30
                    )
                else:
                    # Default to sending as data
                    response = requests.request(
                        method=api_endpoint.http_method,
                        url=url,
                        headers=headers,
                        params=params,
                        data=body,
                        timeout=30
                    )
            else:
                # GET, DELETE, etc. - no body
                response = requests.request(
                    method=api_endpoint.http_method,
                    url=url,
                    headers=headers,
                    params=params,
                    timeout=30
                )
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            # Parse response
            try:
                response_body = response.json()
            except:
                response_body = {"text": response.text}

            '''print("📤 Response received from external API:")
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Body: {response_body}")'''        
            
            test_log.response_status = response.status_code
            test_log.response_headers = dict(response.headers)
            test_log.response_body = response_body
            test_log.response_time_ms = response_time_ms
            test_log.is_success = 200 <= response.status_code < 300
            
        except requests.RequestException as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            test_log.response_status = 0
            test_log.response_time_ms = response_time_ms
            test_log.is_success = False
            test_log.error_message = str(e)
        
        test_log.save()
        
        return Response(APITestLogSerializer(test_log).data)
    
    @action(detail=True, methods=['get'])
    def test_history(self, request, pk=None):
        """Get test history for an API endpoint"""
        api_endpoint = self.get_object()
        logs = api_endpoint.test_logs.all()[:20]  # Last 20 tests
        serializer = APITestLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all unique categories"""
        categories = APIEndpoint.objects.filter(
            owner=request.user
        ).values_list('category', flat=True).distinct()
        return Response([c for c in categories if c])
    
    @action(detail=False, methods=['get'])
    def tags(self, request):
        """Get all unique tags"""
        all_tags = set()
        endpoints = APIEndpoint.objects.filter(owner=request.user)
        for endpoint in endpoints:
            if endpoint.tags:
                all_tags.update(endpoint.tags)
        return Response(list(all_tags))
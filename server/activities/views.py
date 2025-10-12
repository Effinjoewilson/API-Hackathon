from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Activity, GeneratedDocumentation
from rest_framework import serializers
from .documentation.collector import collect_all_data
from .documentation.generator import DocumentationGenerator
from django.utils import timezone

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'status', 'title', 'timestamp', 'details']

class GeneratedDocumentationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedDocumentation
        fields = ['id', 'created_at', 'updated_at', 'documentation_content']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activities(request):
    activities = Activity.objects.all()[:10]
    serializer = ActivitySerializer(activities, many=True)
    return Response(serializer.data)

class GenerateDocumentationView(APIView):
    """
    API endpoint for generating system documentation using AI
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the latest generated documentation"""
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            latest_doc = GeneratedDocumentation.objects.filter(
                owner=request.user,
                is_active=True
            ).first()
            
            if latest_doc:
                return Response({
                    'success': True,
                    'exists': True,
                    'documentation': {
                        'setup': latest_doc.setup_content,
                        'developer': latest_doc.developer_content,
                        'api': latest_doc.api_content,
                        'design': latest_doc.design_content
                    },
                    'created_at': latest_doc.created_at.isoformat(),
                    'updated_at': latest_doc.updated_at.isoformat()
                })
            else:
                return Response({
                    'success': True,
                    'exists': False,
                    'message': 'No documentation found'
                })
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        activity = None
        try:
            # Log the documentation generation attempt
            activity = Activity.objects.create(
                type='documentation',
                status='started',
                title='Documentation Generation',
                details={'trigger': 'user_request', 'is_regeneration': request.data.get('regenerate', False)}
            )
            
            # Step 1: Collect all required data from models
            system_data = collect_all_data()
            if not system_data:
                raise ValueError("No data collected from models")
            
            # Step 2: Initialize documentation generator and generate docs
            generator = DocumentationGenerator()
            if not generator.api_key:
                if activity:
                    activity.status = 'failed'
                    activity.details = {'error': 'OPENROUTER_API_KEY not configured'}
                    activity.save()
                return Response(
                    {'success': False, 'error': 'OpenRouter API key not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            result = generator.generate_documentation(system_data)
            
            if result['success']:
                # Parse the documentation into sections
                sections = self._parse_documentation_sections(result['documentation'])
                
                # Debug logging
                print(f"Setup content length: {len(sections.get('setup', ''))}")
                print(f"Developer content length: {len(sections.get('developer', ''))}")
                print(f"API content length: {len(sections.get('api', ''))}")
                print(f"Design content length: {len(sections.get('design', ''))}")
                
                # Prepare documentation content
                doc_content = {
                    'setup': sections.get('setup', ''),
                    'developer': sections.get('developer', ''),
                    'api': sections.get('api', ''),
                    'design': sections.get('design', ''),
                    'full': result['documentation']
                }
                
                # Save or update documentation in database
                doc, created = GeneratedDocumentation.objects.update_or_create(
                    owner=request.user,
                    is_active=True,
                    defaults={
                        'documentation_content': doc_content,
                        'generation_activity': activity,
                        'updated_at': timezone.now()
                    }
                )
                
                # Update activity for successful generation
                if activity:
                    activity.status = 'completed'
                    activity.title = 'Documentation Generated' if created else 'Documentation Regenerated'
                    activity.details = {
                        'sections': ['setup', 'developer', 'api', 'design'],
                        'doc_id': doc.id
                    }
                    activity.save()
                
                return Response({
                    'success': True,
                    'documentation': result['documentation'],
                    'created': created,
                    'created_at': doc.created_at.isoformat(),
                    'updated_at': doc.updated_at.isoformat()
                })
            else:
                # Update activity for failed generation
                if activity:
                    activity.status = 'failed'
                    activity.title = 'Documentation Generation Failed'
                    activity.details = {'error': result.get('error', 'Unknown error')}
                    activity.save()
                
                return Response({
                    'success': False,
                    'error': result.get('error', 'Unknown error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except ValueError as ve:
            if activity:
                activity.status = 'failed'
                activity.title = 'Documentation Generation Failed'
                activity.details = {'error': str(ve)}
                activity.save()
            
            return Response({
                'success': False,
                'error': str(ve)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            if activity:
                activity.status = 'error'
                activity.title = 'Documentation Generation Error'
                activity.details = {'error': str(e)}
                activity.save()
            
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _parse_documentation_sections(self, markdown):
        """Parse markdown into sections"""
        sections = {'setup': '', 'developer': '', 'api': '', 'design': ''}
        
        lines = markdown.split('\n')
        current_section = ''
        current_content = []
        
        for line in lines:
            header_match = line.strip().startswith('#')
            if header_match:
                # Save previous section
                if current_section and current_content:
                    sections[current_section] = '\n'.join(current_content).strip()
                    current_content = []
                
                # Determine new section
                line_lower = line.lower()
                if 'setup' in line_lower or 'installation' in line_lower:
                    current_section = 'setup'
                elif 'developer' in line_lower or 'development' in line_lower:
                    current_section = 'developer'
                elif 'api' in line_lower:
                    current_section = 'api'
                elif 'design' in line_lower or 'architecture' in line_lower:
                    current_section = 'design'
                    
                if current_section:
                    current_content.append(line)
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section and current_content:
            sections[current_section] = '\n'.join(current_content).strip()
            
        return sections
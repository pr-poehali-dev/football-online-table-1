'''
Business: API для управления календарем матчей
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными матчей или результатом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cursor.execute('''
                SELECT 
                    m.id, m.home_score, m.away_score, m.match_date, m.status,
                    ht.id as home_team_id, ht.name as home_team_name,
                    at.id as away_team_id, at.name as away_team_name
                FROM matches m
                JOIN teams ht ON m.home_team_id = ht.id
                JOIN teams at ON m.away_team_id = at.id
                ORDER BY m.match_date DESC
            ''')
            matches = cursor.fetchall()
            
            for match in matches:
                if match['match_date']:
                    match['match_date'] = match['match_date'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'matches': matches}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cursor.execute('''
                INSERT INTO matches (home_team_id, away_team_id, home_score, away_score, match_date, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, home_team_id, away_team_id, home_score, away_score, match_date, status
            ''', (
                body.get('home_team_id'),
                body.get('away_team_id'),
                body.get('home_score', 0),
                body.get('away_score', 0),
                body.get('match_date'),
                body.get('status', 'scheduled')
            ))
            
            new_match = cursor.fetchone()
            conn.commit()
            
            if new_match['match_date']:
                new_match['match_date'] = new_match['match_date'].isoformat()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'match': new_match}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            match_id = body.get('id')
            
            cursor.execute('''
                UPDATE matches 
                SET home_team_id = %s, away_team_id = %s, home_score = %s, 
                    away_score = %s, match_date = %s, status = %s
                WHERE id = %s
                RETURNING id, home_team_id, away_team_id, home_score, away_score, match_date, status
            ''', (
                body.get('home_team_id'),
                body.get('away_team_id'),
                body.get('home_score'),
                body.get('away_score'),
                body.get('match_date'),
                body.get('status'),
                match_id
            ))
            
            updated_match = cursor.fetchone()
            conn.commit()
            
            if updated_match and updated_match['match_date']:
                updated_match['match_date'] = updated_match['match_date'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'match': updated_match}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            match_id = params.get('id')
            
            cursor.execute('DELETE FROM matches WHERE id = %s', (match_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    finally:
        cursor.close()
        conn.close()

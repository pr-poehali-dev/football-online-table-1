'''
Business: API для управления футбольной таблицей с реал-тайм обновлениями
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными таблицы или результатом обновления
'''

import json
import os
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # GET - получить всю таблицу
        if method == 'GET':
            cursor.execute('''
                SELECT id, name, played, won, drawn, lost, 
                       goals_for, goals_against, goal_difference, 
                       points, position, updated_at
                FROM teams 
                ORDER BY position ASC
            ''')
            teams = cursor.fetchall()
            
            # Конвертируем datetime в строку
            for team in teams:
                if team['updated_at']:
                    team['updated_at'] = team['updated_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'teams': teams}),
                'isBase64Encoded': False
            }
        
        # PUT - обновить команду
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            team_id = body.get('id')
            
            # Обновляем данные команды
            cursor.execute('''
                UPDATE teams 
                SET name = %s, played = %s, won = %s, drawn = %s, lost = %s,
                    goals_for = %s, goals_against = %s, goal_difference = %s,
                    points = %s, position = %s, updated_at = %s
                WHERE id = %s
                RETURNING id, name, played, won, drawn, lost, 
                          goals_for, goals_against, goal_difference, 
                          points, position, updated_at
            ''', (
                body.get('name'),
                body.get('played'),
                body.get('won'),
                body.get('drawn'),
                body.get('lost'),
                body.get('goals_for'),
                body.get('goals_against'),
                body.get('goal_difference'),
                body.get('points'),
                body.get('position'),
                datetime.utcnow(),
                team_id
            ))
            
            updated_team = cursor.fetchone()
            conn.commit()
            
            if updated_team['updated_at']:
                updated_team['updated_at'] = updated_team['updated_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'team': updated_team}),
                'isBase64Encoded': False
            }
        
        # POST - добавить новую команду
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cursor.execute('''
                INSERT INTO teams (name, played, won, drawn, lost, 
                                 goals_for, goals_against, goal_difference, 
                                 points, position, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, played, won, drawn, lost, 
                          goals_for, goals_against, goal_difference, 
                          points, position, updated_at
            ''', (
                body.get('name', 'Новая команда'),
                body.get('played', 0),
                body.get('won', 0),
                body.get('drawn', 0),
                body.get('lost', 0),
                body.get('goals_for', 0),
                body.get('goals_against', 0),
                body.get('goal_difference', 0),
                body.get('points', 0),
                body.get('position', 99),
                datetime.utcnow()
            ))
            
            new_team = cursor.fetchone()
            conn.commit()
            
            if new_team['updated_at']:
                new_team['updated_at'] = new_team['updated_at'].isoformat()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'team': new_team}),
                'isBase64Encoded': False
            }
        
        # DELETE - удалить команду
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            team_id = params.get('id')
            
            cursor.execute('DELETE FROM teams WHERE id = %s', (team_id,))
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

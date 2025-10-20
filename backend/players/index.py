'''
Business: API для управления игроками команд
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными игроков или результатом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

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
            params = event.get('queryStringParameters', {})
            team_id = params.get('team_id')
            
            if team_id:
                cursor.execute('''
                    SELECT id, team_id, name, number, position, goals, assists, yellow_cards, red_cards
                    FROM players 
                    WHERE team_id = %s
                    ORDER BY number ASC
                ''', (team_id,))
            else:
                cursor.execute('''
                    SELECT id, team_id, name, number, position, goals, assists, yellow_cards, red_cards
                    FROM players 
                    ORDER BY team_id, number ASC
                ''')
            
            players = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'players': players}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cursor.execute('''
                INSERT INTO players (team_id, name, number, position, goals, assists, yellow_cards, red_cards)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, team_id, name, number, position, goals, assists, yellow_cards, red_cards
            ''', (
                body.get('team_id'),
                body.get('name', 'Новый игрок'),
                body.get('number', 0),
                body.get('position', ''),
                body.get('goals', 0),
                body.get('assists', 0),
                body.get('yellow_cards', 0),
                body.get('red_cards', 0)
            ))
            
            new_player = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'player': new_player}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            player_id = params.get('id')
            
            cursor.execute('DELETE FROM players WHERE id = %s', (player_id,))
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

-- Создание таблицы для хранения футбольных команд и статистики
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрой сортировки по позициям
CREATE INDEX idx_teams_position ON teams(position);

-- Вставка начальных данных
INSERT INTO teams (name, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, position) VALUES
('Манчестер Сити', 10, 8, 1, 1, 28, 10, 18, 25, 1),
('Арсенал', 10, 7, 2, 1, 24, 12, 12, 23, 2),
('Ливерпуль', 10, 7, 1, 2, 26, 14, 12, 22, 3),
('Тоттенхэм', 10, 6, 2, 2, 22, 15, 7, 20, 4),
('Челси', 10, 5, 3, 2, 18, 13, 5, 18, 5),
('Ньюкасл', 10, 5, 2, 3, 17, 14, 3, 17, 6),
('Манчестер Юнайтед', 10, 4, 3, 3, 15, 14, 1, 15, 7),
('Вест Хэм', 10, 4, 2, 4, 16, 17, -1, 14, 8)
ON CONFLICT DO NOTHING;
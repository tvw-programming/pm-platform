package config

import "os"

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

type ServerConfig struct {
	Port        string
	CORSOrigins string
}

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func Load() *Config {
	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "pm_platform"),
		},
		Server: ServerConfig{
			Port:        getEnv("SERVER_PORT", "3001"),
			CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"),
		},
	}
}

func (c *DatabaseConfig) DSN() string {
	return "host=" + c.Host +
		" port=" + c.Port +
		" user=" + c.User +
		" password=" + c.Password +
		" dbname=" + c.DBName +
		" sslmode=disable TimeZone=UTC"
}

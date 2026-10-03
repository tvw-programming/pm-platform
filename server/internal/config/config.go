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

type AgentRuntimeConfig struct {
	PythonAgentURL string
	LMStudioURL    string
	LMStudioAPIKey string
	DefaultModel   string
}

type Config struct {
	Database     DatabaseConfig
	Server       ServerConfig
	AgentRuntime AgentRuntimeConfig
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
			Port:        getEnv("SERVER_PORT", "5589"),
			CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5588,http://localhost:5590,http://localhost:3000"),
		},
		AgentRuntime: AgentRuntimeConfig{
			PythonAgentURL: getEnv("PYTHON_AGENT_URL", "http://127.0.0.1:5591"),
			LMStudioURL:    getEnv("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234/v1"),
			LMStudioAPIKey: getEnv("LM_STUDIO_API_KEY", ""),
			DefaultModel:   getEnv("LM_STUDIO_DEFAULT_MODEL", ""),
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

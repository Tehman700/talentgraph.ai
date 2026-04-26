from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    # Backward compatibility for older .env files.
    claude_api_key: str = ""
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""
    resend_api_key: str = ""
    mapbox_token: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def llm_api_key(self) -> str:
        return (self.openai_api_key or self.claude_api_key or "").strip()


settings = Settings()

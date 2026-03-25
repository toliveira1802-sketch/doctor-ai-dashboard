"""AgentBus - In-process message system for inter-agent communication."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Awaitable
import uuid


@dataclass
class AgentMessage:
    from_agent: str
    to_agent: str
    action: str
    payload: dict = field(default_factory=dict)
    conversation_id: str | None = None
    priority: int = 0  # 0=normal, 1=high, 2=urgent
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class AgentBus:
    """Central message bus for agent-to-agent communication."""

    def __init__(self):
        self._handlers: dict[str, list[Callable[[AgentMessage], Awaitable[dict]]]] = {}
        self._log: list[AgentMessage] = []

    def register(self, agent_name: str, handler: Callable[[AgentMessage], Awaitable[dict]]):
        """Register an agent's message handler."""
        if agent_name not in self._handlers:
            self._handlers[agent_name] = []
        self._handlers[agent_name].append(handler)

    async def send(self, message: AgentMessage) -> dict:
        """Send a message to a target agent. Returns the response."""
        self._log.append(message)

        handlers = self._handlers.get(message.to_agent, [])
        if not handlers:
            return {"error": f"No handler registered for agent: {message.to_agent}"}

        # Call the first registered handler
        result = await handlers[0](message)
        return result

    async def broadcast(self, message: AgentMessage) -> list[dict]:
        """Send a message to all registered agents (except sender)."""
        results = []
        for agent_name, handlers in self._handlers.items():
            if agent_name != message.from_agent and handlers:
                msg = AgentMessage(
                    from_agent=message.from_agent,
                    to_agent=agent_name,
                    action=message.action,
                    payload=message.payload,
                    conversation_id=message.conversation_id,
                    priority=message.priority,
                )
                result = await handlers[0](msg)
                results.append({"agent": agent_name, "result": result})
        return results

    def get_log(self, limit: int = 50) -> list[dict]:
        """Get recent message log."""
        return [
            {
                "id": m.id,
                "from": m.from_agent,
                "to": m.to_agent,
                "action": m.action,
                "timestamp": m.timestamp.isoformat(),
                "priority": m.priority,
            }
            for m in self._log[-limit:]
        ]


# Singleton
agent_bus = AgentBus()

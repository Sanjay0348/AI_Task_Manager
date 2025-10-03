import logging
from typing import Annotated, Dict, Any, List
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# from langgraph.prebuilt import ToolNode  # Not needed with custom async tool execution
from app.tools.task_tools import TASK_TOOLS
from app.core.config import settings
import json
from datetime import datetime

# ----------------- Setup Logging -----------------
logging.basicConfig(
    level=logging.INFO,  # Change to DEBUG for more verbosity
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("TaskManagementAgent")


# ----------------- Agent State -------------------
class AgentState(dict):
    messages: Annotated[List, add_messages]
    user_input: str
    tool_results: Dict[str, Any]
    final_response: str


# ----------------- Agent -------------------------
class TaskManagementAgent:
    def __init__(self):
        logger.info("Initializing TaskManagementAgent...")
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro",
            temperature=0.1,
            google_api_key=settings.gemini_api_key,
            # convert_system_message_to_human=True,
        )
        logger.info("LLM initialized with Gemini model.")

        # Bind tools
        self.llm_with_tools = self.llm.bind_tools(TASK_TOOLS)

        # Build graph
        self.graph = self._build_graph()
        logger.info("Agent workflow graph built successfully.")

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow for task management."""

        def agent_node(state: AgentState) -> AgentState:
            logger.debug(f"[agent_node] Received state: {state}")
            user_input = state.get("user_input", "")
            messages = state.get("messages", [])
            logger.info(f"[agent_node] Processing user input: {user_input}")
            from google import generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            for model in genai.list_models():
                print(model.name)
            # System prompt
            system_prompt = """You are an AI-powered task management assistant. You help users manage their tasks through natural language commands.

Your capabilities include:
- Creating new tasks with titles, descriptions, priorities, and due dates
- Updating existing tasks (status, priority, due date, etc.)
- Deleting tasks
- Listing and filtering tasks
- Searching through tasks

When users give you natural language commands, analyze their intent and use the appropriate tools to fulfill their requests. Always provide helpful, conversational responses.

For task creation:
- Extract title (required), description (optional), priority (low/medium/high/urgent), due date
- Parse natural language dates like "tomorrow", "next week", "in 3 days"

For task updates:
- Allow users to identify tasks by ID or partial title match
- Support status changes: "mark as done", "set to in progress", etc.
- Handle priority updates and due date changes

For task queries:
- Support filtering by status, priority, overdue status
- Allow text search in titles and descriptions
- Provide clear, organized task lists

Always be helpful and conversational. If a request is ambiguous, ask for clarification."""

            # Convert system message to human message for Gemini compatibility
            full_messages = [HumanMessage(content=f"System: {system_prompt}")]
            if messages:
                full_messages.extend(messages)
            if user_input:
                full_messages.append(HumanMessage(content=user_input))

            logger.debug(f"[agent_node] Sending messages to LLM: {full_messages}")

            response = self.llm_with_tools.invoke(full_messages)
            logger.info(f"[agent_node] LLM response: {response}")

            new_messages = messages + [HumanMessage(content=user_input), response]

            return {
                "messages": new_messages,
                "user_input": user_input,
                "tool_results": state.get("tool_results", {}),
                "final_response": "",
            }

        async def execute_tools(state: AgentState) -> AgentState:
            logger.debug(f"[execute_tools] Current state: {state}")
            messages = state.get("messages", [])
            last_message = messages[-1] if messages else None

            if (
                last_message
                and hasattr(last_message, "tool_calls")
                and last_message.tool_calls
            ):
                logger.info(
                    f"[execute_tools] Tool calls detected: {last_message.tool_calls}"
                )

                # Execute tools manually with async support
                tool_messages = []
                extracted_results = {}

                for tool_call in last_message.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_call_id = tool_call["id"]

                    # Find the tool function
                    tool_func = None
                    for tool in TASK_TOOLS:
                        if tool.name == tool_name:
                            tool_func = tool
                            break

                    if tool_func:
                        try:
                            # Execute the async tool
                            result = await tool_func.ainvoke(tool_args)

                            # Create tool message
                            from langchain_core.messages import ToolMessage

                            tool_message = ToolMessage(
                                content=result, tool_call_id=tool_call_id
                            )
                            tool_messages.append(tool_message)

                            # Extract result for processing
                            try:
                                result_data = json.loads(result)
                                extracted_results[tool_call_id] = result_data
                            except json.JSONDecodeError:
                                extracted_results[tool_call_id] = {"content": result}

                        except Exception as e:
                            error_msg = f"Error executing tool {tool_name}: {str(e)}"
                            from langchain_core.messages import ToolMessage

                            tool_message = ToolMessage(
                                content=error_msg, tool_call_id=tool_call_id
                            )
                            tool_messages.append(tool_message)
                            extracted_results[tool_call_id] = {"content": error_msg}
                    else:
                        error_msg = f"Tool {tool_name} not found"
                        from langchain_core.messages import ToolMessage

                        tool_message = ToolMessage(
                            content=error_msg, tool_call_id=tool_call_id
                        )
                        tool_messages.append(tool_message)
                        extracted_results[tool_call_id] = {"content": error_msg}

                logger.info(f"[execute_tools] Tool results: {extracted_results}")
                updated_messages = messages + tool_messages

                return {
                    "messages": updated_messages,
                    "user_input": state.get("user_input", ""),
                    "tool_results": extracted_results,
                    "final_response": "",
                }

            logger.info("[execute_tools] No tool calls found.")
            return state

        def generate_response(state: AgentState) -> AgentState:
            logger.debug(f"[generate_response] State before response: {state}")
            messages = state.get("messages", [])
            tool_results = state.get("tool_results", {})

            response_prompt = """Based on the tool execution results, provide a helpful and conversational response to the user.

Be specific about what was accomplished:
- If tasks were created, mention the task details
- If tasks were updated, explain what changed
- If tasks were listed, provide a clear summary
- If there were errors, explain them clearly and suggest solutions

Keep the response natural and user-friendly while being informative."""
            # Convert system message to human message for Gemini compatibility
            response_messages = messages + [
                HumanMessage(content=f"System: {response_prompt}")
            ]

            final_ai_response = self.llm.invoke(response_messages)
            logger.info(
                f"[generate_response] Final AI response: {final_ai_response.content}"
            )

            return {
                "messages": messages + [final_ai_response],
                "user_input": state.get("user_input", ""),
                "tool_results": tool_results,
                "final_response": final_ai_response.content,
            }

        def should_continue(state: AgentState) -> str:
            messages = state.get("messages", [])
            last_message = messages[-1] if messages else None
            if (
                last_message
                and hasattr(last_message, "tool_calls")
                and last_message.tool_calls
            ):
                logger.debug("[should_continue] Routing to execute_tools.")
                return "execute_tools"
            else:
                logger.debug("[should_continue] Routing to generate_response.")
                return "generate_response"

        workflow = StateGraph(AgentState)
        workflow.add_node("agent", agent_node)
        workflow.add_node("execute_tools", execute_tools)
        workflow.add_node("generate_response", generate_response)
        workflow.set_entry_point("agent")
        workflow.add_conditional_edges(
            "agent",
            should_continue,
            {
                "execute_tools": "execute_tools",
                "generate_response": "generate_response",
            },
        )
        workflow.add_edge("execute_tools", "generate_response")
        workflow.add_edge("generate_response", END)
        return workflow.compile()

    async def process_message(self, user_input: str) -> Dict[str, Any]:
        logger.info(f"[process_message] Received input: {user_input}")
        print(f"[process_message] Received input: {user_input}")
        try:
            initial_state = {
                "messages": [],
                "user_input": user_input,
                "tool_results": {},
                "final_response": "",
            }
            final_state = await self.graph.ainvoke(initial_state)
            logger.info(f"[process_message] Final state: {final_state}")

            return {
                "success": True,
                "response": final_state.get("final_response", ""),
                "tool_results": final_state.get("tool_results", {}),
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.exception("Error in process_message")
            return {
                "success": False,
                "response": f"I apologize, but I encountered an error: {str(e)}. Please try rephrasing your request.",
                "tool_results": {},
                "timestamp": datetime.utcnow().isoformat(),
            }


# Global agent instance
task_agent = TaskManagementAgent()

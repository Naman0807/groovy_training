"""LangChain agent with web search + calculator tool use and memory."""

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_classic.memory import ConversationBufferMemory
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool

load_dotenv()


@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression. Input must be valid Python math."""
    try:
        return str(eval(expression, {"__builtins__": {}}, {"abs": abs, "round": round, "min": min, "max": max, "pow": pow}))
    except Exception as e:
        return f"Error: {e}"


tools = [DuckDuckGoSearchRun(), calculator]

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0,
)

memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant. Use the tools to answer questions."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, memory=memory, verbose=True)


if __name__ == "__main__":
    while True:
        query = input("\nYou: ")
        if query.lower() in ("exit", "quit"):
            break
        response = agent_executor.invoke({"input": query})
        print(f"Agent: {response['output']}")

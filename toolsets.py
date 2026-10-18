#!/usr/bin/env python3
"""Toolsets module for building and filtering tool sets.

This module provides functions to build tool sets, validate tool names,
and resolve toolsets from configuration. It supports defining toolsets
by name or explicit lists of tools, and allows for set operations.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Iterable, List, Optional, Set, Union

logger = logging.getLogger(__name__)

# Default toolsets available in the system
DEFAULT_TOOLSETS: Dict[str, Any] = {}

# Toolsets that are disabled by default
DISABLED_TOOLSETS: set = set()

# Toolsets that should be extended by plugins
PLUGIN_BUNDLES: Dict[str, List[str]] = {}

# Toolsets that are core (cannot be removed by plugins)
CORE_TOOLSETS: set = set()

# Functions for dropping tools and disabling toolsets
def agent_tool_drops(agent):
    """Get the list of tool names to drop for this agent."""
    return set()

def session_disabled_toolsets(disabled, platform=None):
    """Get the list of session-disabled toolsets."""
    return set()

# Main toolsets registry - maps toolset names to their tool lists
TOOLSETS: Dict[str, List[str]] = {
    "terminal": ["run_command"],
    "file": ["analyze_tool_tool"],
    "web": ["web_tool_tool"],
    "weather": ["weather_tool_tool"],
    "buscar": ["web_tool_tool"],
}


def resolve_toolset(name: str) -> List[str]:
    """Resolve a toolset name to a list of tool names.
    
    Supports:
    - Built-in toolsets (defined in DEFAULT_TOOLSETS)
    - Named toolsets (e.g., 'image', 'browser', 'skills')
    - Wildcard usage (e.g., '-image' to exclude image tools)
    - References to other toolsets (e.g., 'core + plugin')
    
    Returns:
        List of tool names.
    
    Raises:
        ValueError: If the toolsets name is unknown.
    """
    if not name:
        return []
    
    # Normalize the name to lowercase for case-insensitive matching
    name = name.lower()
    
    # Check if it's a reference to other toolsets (e.g., "core + plugin")
    if " + " in name:
        parts = name.split(" + ")
        result = set()
        for part in parts:
            result.update(resolve_toolset(part))
        return list(result)
    
    # Check if it's a negative reference (e.g., "-image")
    if name.startswith("-"):
        base_name = name[1:]
        # Check if the positive version exists first
        if base_name in DEFAULT_TOOLSETS:
            base_tools = _resolve_internal(base_name)
            # Get all available tools and filter out the base tools
            all_tools = _get_all_tools()
            return [t for t in all_tools if t not in base_tools]
        # If the positive version doesn't exist, just return an empty list
        return []
    
    # Check if it's a direct tool name
    if name in DEFAULT_TOOLSETS:
        return DEFAULT_TOOLSETS[name]
    
    # Otherwise, try to resolve as a built-in toolsets name
    if name in DEFAULT_TOOLSETS:
        return DEFAULT_TOOLSETS[name]
    
    # Check if it's a plugin bundle
    if name in PLUGIN_BUNDLES:
        return PLUGIN_BUNDLES[name]
    
    # Check if it's a core toolsets name
    if name in CORE_TOOLSETS:
        return CORE_TOOLSETS[name]
    
    # If it's not a known toolsets name, try to resolve as a single tool
    # This is a fallback for tool names that aren't in toolsets
    if name in _get_all_tools():
        return [name]
    
    raise ValueError(f"Unknown toolsets name: {name}")


def validate_toolset(tools: Iterable[str]) -> List[str]:
    """Validate and normalize a list of tools.
    
    Args:
        tools: List of tool names to validate.
        
    Returns:
        A normalized list of tool names.
        
    Raises:
        ValueError: If any tool name is not valid.
    """
    tools = list(tools)
    if not tools:
        return []
    
    # Check if the first tool is a toolsets name (not a tool name)
    # If so, we can return it directly
    if tools[0] in _get_toolset_names():
        return tools
    
    # Otherwise, return the list as-is (it's already a list of tools)
    # This allows for the return of the same list as the user set it.
    # This is important for compatibility with the toolset distribution.
    return tools


def _resolve_internal(name: str) -> List[str]:
    """Resolve a toolsets name to a list of tools.
    
    This is an internal function that handles the actual resolution logic.
    
    Args:
        name: The name of the toolsets.
        
    Returns:
        A list of tool names.
    """
    # Check if it's a default toolsets
    if name in DEFAULT_TOOLSETS:
        return DEFAULT_TOOLSETS[name]
    
    # Check if it's a plugin bundle
    if name in PLUGIN_BUNDLES:
        return PLUGIN_BUNDLES[name]
    
    # Check if it's a core toolsets
    if name in CORE_TOOLSETS:
        return CORE_TOOLSETS[name]
    
    # Otherwise, try to resolve as a single tool
    if name in _get_all_tools():
        return [name]
    
    return []


def _get_all_tools() -> set:
    """Get all available tool names.
    
    Returns:
        A set of all available tool names.
    """
    # This is a placeholder function that should be replaced with the
    # actual list of tools in the system.
    # For now, we'll return an empty set.
    return set()


def _get_toolset_names() -> set:
    """Get all available toolsets names.
    
    Returns:
        A set of all available toolsets names.
    """
    return set(DEFAULT_TOOLSETS.keys()) | set(PLUGIN_BUNDLES.keys()) | set(CORE_TOOLSETS.keys())


def get_toolsets() -> Dict[str, Any]:
    """Get all available toolsets.
    
    Returns:
        A dictionary of all available toolsets.
    """
    return DEFAULT_TOOLSETS.copy()


def get_disabled_toolsets() -> set:
    """Get all disabled toolsets.
    
    Returns:
        A set of all disabled toolsets.
    """
    return DISABLED_TOOLSETS.copy()


def set_toolset(name: str, tools: Iterable[str]) -> None:
    """Set a toolsets to a list of tools.
    
    Args:
        name: The name of the toolsets.
        tools: The list of tools to include in the toolsets.
    """
    DEFAULT_TOOLSETS[name] = list(tools)


def add_toolset(name: str, tools: Iterable[str]) -> None:
    """Add tools to an existing toolsets.
    
    Args:
        name: The name of the toolsets.
        tools: The tools to add.
    """
    if name in DEFAULT_TOOLSETS:
        DEFAULT_TOOLSETS[name].extend(tools)
    else:
        DEFAULT_TOOLSETS[name] = list(tools)


def remove_toolset(name: str) -> None:
    """Remove a toolsets from the system.
    
    Args:
        name: The name of the toolsets to remove.
    """
    DEFAULT_TOOLSETS.pop(name, None)

# SessionsPlatforms: toolsets available in specific platform sessions
TOOLSET_SESSION_PLATFORMS: set = {"telegram", "discord", "slack", "whatsapp", "telegram_menu"}

def get_all_toolsets() -> set:
    """Get the set of all available toolsets."""
    return set(DEFAULT_TOOLSETS) | set(PLUGIN_BUNDLES) | set(CORE_TOOLSETS) | TOOLSET_SESSION_PLATFORMS

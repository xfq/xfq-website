---
title: Ask W3C i18n
date: 2026-06-23 09:00:00
summary: "An experiment in using an AI-assisted, citation-grounded interface to make W3C Internationalization guidance easier to find."
tags:
  - i18n
  - w3c
  - ai
lang: en
featured: true
published: true
---

I built [Ask W3C i18n](https://i18n-drafts-assistant.onrender.com/) as an experiment: can an AI-assisted interface help readers find W3C Internationalization guidance?

The project indexes W3C i18n content, retrieve relevant sections, and answer from that evidence.

## The Problem

W3C Internationalization material covers many topics: character encoding, language tags, bidirectional text, typography, and more. The material is valuable, but it is spread across many articles, tutorials, and /TR documents.

For people who already know the [site](https://www.w3.org/International/), this is manageable. For other people, it can be harder. Ask W3C i18n is meant to help with that discovery problem.

## The Tool

The application indexes content from the W3C Internationalization sources. At query time, it retrieves relevant chunks, builds an answer from that retrieved evidence, and returns citations.

The product is simple. Answers should be grounded in indexed W3C i18n sources. Citations should be visible. If the evidence is weak, the system should say so.

AI systems can "hallucinate". They can make weak evidence sound strong. They can blur the distinction between a published document, a draft, a review-stage document, and an outdated document.

If this experiment works, it should make W3C Internationalization guidance easier to find without making it easier to misrepresent. If it fails, the failure should be visible enough that the community can point to it, discuss it, and decide what should change.

Future plans include expanding the index with more W3C sources, so the assistant can cover a broader range of relevant guidance.

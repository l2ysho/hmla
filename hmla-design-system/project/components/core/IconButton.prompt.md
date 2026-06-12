Square icon-only control — toolbars, transport, toggles. Always give it an `aria-label`. Set `active` for lit toggle states (mute/solo/freeze).

```jsx
<IconButton aria-label="regenerate seed"><RefreshSvg/></IconButton>
<IconButton aria-label="freeze" active={frozen} onClick={toggle}>∞</IconButton>
```

Sizes `sm` / `md` / `lg`. `active` applies the accent border + glow.

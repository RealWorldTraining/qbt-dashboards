# GitHub SSH Setup - RealWorldTraining Repos

**⚠️ IMPORTANT:** All RealWorldTraining repos require SSH authentication, not HTTPS tokens.

---

## Why SSH?

✅ **SSH keys never expire** (unlike PAT tokens)  
✅ **Works across all RealWorldTraining repos** automatically  
✅ **No token scope issues**  
✅ **More secure** (key-based auth)

---

## Quick Setup (New Machine)

### 1. Generate SSH Key
```bash
# Check if you already have one
ls ~/.ssh/id_ed25519.pub

# If not, generate:
ssh-keygen -t ed25519 -C "aaroncave@gmail.com" -f ~/.ssh/id_ed25519
# Press Enter for all prompts (no passphrase needed for automation)
```

### 2. Add Public Key to GitHub
```bash
# Copy public key to clipboard
cat ~/.ssh/id_ed25519.pub
```

- Go to: [github.com/settings/keys](https://github.com/settings/keys) (logged in as **ThanosAndProfessorX**)
- Click **"New SSH key"**
- Title: `[Your Machine Name] - [Date]` (e.g., "MacBook Pro - 2026-02-17")
- Paste the public key
- Click **"Add SSH key"**

### 3. Test Connection
```bash
ssh -T git@github.com
# Should say: "Hi ThanosAndProfessorX!"
```

### 4. Clone Repos with SSH
```bash
# qbt-dashboards
git clone git@github.com:RealWorldTraining/qbt-dashboards.git

# qbtraining-site
git clone git@github.com:RealWorldTraining/qbtraining-site.git

# google-ads-optimizer
git clone git@github.com:RealWorldTraining/google-ads-optimizer.git
```

---

## Already Cloned with HTTPS? Switch to SSH

If you cloned with `https://github.com/...` and getting token errors:

```bash
cd ~/clawd/qbt-dashboards
git remote set-url origin git@github.com:RealWorldTraining/qbt-dashboards.git

cd ~/clawd/qbtraining-site
git remote set-url origin git@github.com:RealWorldTraining/qbtraining-site.git
```

Now `git push` will work without token issues.

---

## Troubleshooting

### "Permission denied (publickey)"
- Check SSH key is added to GitHub: [github.com/settings/keys](https://github.com/settings/keys)
- Test connection: `ssh -T git@github.com`
- Verify you're logged into **ThanosAndProfessorX** GitHub account

### "Could not read from remote repository"
- Check remote URL is SSH format:
  ```bash
  git remote -v
  # Should show: git@github.com:RealWorldTraining/...
  # NOT: https://github.com/RealWorldTraining/...
  ```
- If HTTPS, switch to SSH (see above)

### Multiple Machines
- **Each machine needs its own SSH key** (don't copy private keys)
- Add each machine's public key to [github.com/settings/keys](https://github.com/settings/keys)
- You can have unlimited SSH keys per GitHub account

---

## Security Notes

- **Private key** (`~/.ssh/id_ed25519`): Never share, never commit to git
- **Public key** (`~/.ssh/id_ed25519.pub`): Safe to share, add to GitHub
- **No passphrase needed** for automation/CI workflows
- **With passphrase** if you want extra security on personal machines

---

## RealWorldTraining Repos (SSH URLs)

All repos use this format: `git@github.com:RealWorldTraining/[repo-name].git`

**Current repos:**
- `qbt-dashboards` - QuickBooks Training dashboards (Next.js)
- `qbtraining-site` - Main marketing site
- `google-ads-optimizer` - Google Ads automation toolkit

---

**Last Updated:** 2026-02-17  
**GitHub Account:** ThanosAndProfessorX  
**Organization:** RealWorldTraining

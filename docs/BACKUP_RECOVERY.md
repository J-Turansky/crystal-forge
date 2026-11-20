# Back up and recover your Studio workspace

Studio saves work in the current browser profile. To move to another device or protect your work before clearing browser data, download a complete backup. A print export such as STL or 3MF is not a workspace backup.

## Download a backup

1. Open **Library > Backups & Recovery**.
2. Select **Download complete backup**. Keep the downloaded JSON somewhere private outside the browser, and add a date to the filename so you can identify it later.

## Recover from a JSON file

1. On the destination device or browser, first download a backup of any work you already have there.
2. In **Library > Backups & Recovery**, use **Restore backup or old Crystal JSON** to pick your complete backup file. For a Studio backup, the **Review backup** dialog lists items found only on this device, items found only in the backup, and items with the same ID but different content. Opening the review doesn't import anything.
3. Under **Recover**, choose **Complete backup**, a particular project, or a Library model revision. Then choose a **Recovery strategy**:

   | Strategy | What happens |
   | --- | --- |
   | **Keep local workspace** | Close the review without importing. **Cancel** also leaves your workspace unchanged. |
   | **Import separate copies** | Recover the selected work as separate copies rather than merging it into the Library. |
   | **Merge new items and copy conflicts** | Add new items and preserve both versions when the same ID has different content. Unchanged items don't need another copy. |

4. Select **Apply choice** and confirm the recovery if prompted. Studio saves a local recovery snapshot before writing changes. Look for **Recovery complete**, then find the recovered project or model in the Library. Your active project stays open; open a recovered project separately when you're ready.

## Use a private GitHub backup

This is manual, not automatic sync. Open a Crystal model's saved-project controls and connect your private repository under **Private GitHub sync**. Do not use a public repository or share your token, backup file, or private repository details in an issue.

- On the source device, use **Library > Backups & Recovery > Upload studio backup** and wait for **Backup saved**.
- On the destination device, connect the same private repository, then use **Check private backup**. Review and apply your selection as above.
- If upload reports that the remote has changed, check the backup again and review and merge the complete backup before retrying. Do not overwrite another device's changes.

## If something goes wrong

- **Could not read backup:** Check that you selected the original backup JSON, not a print export or a partially downloaded file. Try another dated backup; keep the original file.
- **Recovery won't apply:** Leave the current workspace open. Read the message in the review dialog. If local work changed, review the backup again. If storage is full, download a complete backup before clearing any data.
- **Need the previous state:** In **Backups & Recovery**, select a dated **Review local snapshot** if available. It uses the same review process rather than rolling back your entire workspace. These snapshots are stored in the browser, so they aren't a substitute for a downloaded backup.

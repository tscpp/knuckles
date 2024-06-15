module.exports.getAddMessage = async () => {
  return `docs(changeset): add changeset`;
};

module.exports.getVersionMessage = async (releasePlan) => {
  const publishableReleases = releasePlan.releases.filter(
    (release) => release.type !== "none",
  );

  return (
    `chore(release): version ${publishableReleases.length} package(s)` +
    "\n\n" +
    publishableReleases
      .map((release) => `- ${release.name}@${release.newVersion}`)
      .join("\n")
  );
};

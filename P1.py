import os
os.environ['OMP_NUM_THREADS'] = '3'

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import adjusted_rand_score, silhouette_score
from collections import Counter

# You are provided with a dataset leaves.csv, which contains 5 attributes of various plant leaves: Leaf
# length, Leaf width, Color intensity, Vein density, Symmetry score. The dataset includes a
# header, and the values are delimited by semicolons. Furthermore, in the last column is given the
# leaf type (symbolically), but you will hide this column to the given subtasks, except for task 5.

df = pd.read_csv('data/leaves.csv', delimiter=';')
true_labels = df['Leaf_Type'].copy()
df_clustering = df.drop('Leaf_Type', axis=1)

scaler = StandardScaler()
df_scaled = scaler.fit_transform(df_clustering)

# 1. Optimal Number of Clusters:
# Apply the "elbow" rule (a.k.a. "knee" method) on the dataset to determine the optimal number of
# clusters K0.

wcss = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=i, init='k-means++', max_iter=300, n_init=10, random_state=0)
    kmeans.fit(df_scaled)
    wcss.append(kmeans.inertia_)

plt.figure(figsize=(10, 6))
plt.plot(range(1, 11), wcss)
plt.title('Elbow Method')
plt.xlabel('Number of clusters')
plt.ylabel('WCSS')
plt.show()

# Elbow point is at 2, so K0 = 2
K0 = 2

# 2. K-Means Clustering:
# a. Apply the K-means clustering algorithm on the dataset using K = K0 .
# b. Visualize the clusters using a scatter plot with dimensionality reduction (e.g., PCA).
# c. Create a heatmap to illustrate the clustering results.

pca = PCA(n_components=2)
df_pca = pca.fit_transform(df_scaled)

# Where K = 2
kmeans = KMeans(n_clusters=K0, init='k-means++', max_iter=300, n_init=10, random_state=0)
kmeans_labels = kmeans.fit_predict(df_scaled)

plt.figure(figsize=(10, 6))
plt.scatter(df_pca[:, 0], df_pca[:, 1], c=kmeans_labels, cmap='viridis')
plt.xlabel('PCA1')
plt.ylabel('PCA2')
plt.title('K-Means Clustering')
plt.show()

df_clustered = pd.DataFrame(df_scaled, columns=df_clustering.columns)
df_clustered['Cluster'] = kmeans_labels
cluster_means = df_clustered.groupby('Cluster').mean()

plt.figure(figsize=(10, 8))
sns.heatmap(cluster_means, cmap='viridis', annot=True)
plt.title('K-Means Clustering Heatmap (Cluster Means)')
plt.show()

# 3. DBSCAN Clustering:
# a. Apply the DBSCAN clustering algorithm with ε=0.5 and minPts= 5.
# b. Visualize the clusters using a scatter plot with dimensionality reduction (e.g., PCA).
# c. Create a heatmap to illustrate the clustering results.

# Where ε=0.5 and minPts=5
dbscan = DBSCAN(eps=0.5, min_samples=5)
dbscan_labels = dbscan.fit_predict(df_scaled)

plt.figure(figsize=(10, 6))
plt.scatter(df_pca[:, 0], df_pca[:, 1], c=dbscan_labels, cmap='viridis')
plt.xlabel('PCA1')
plt.ylabel('PCA2')
plt.title('DBSCAN Clustering')
plt.show()

df_clustered['Cluster'] = dbscan_labels
cluster_means = df_clustered.groupby('Cluster').mean()

plt.figure(figsize=(10, 8))
sns.heatmap(cluster_means, cmap='viridis', annot=True)
plt.title('DBSCAN Clustering Heatmap (Cluster Means)')
plt.show()

# 4. Hierarchical Clustering:
# a. Apply single-linkage hierarchical clustering to K0 partitions.
# b. Visualize the clusters using a scatter plot with dimensionality reduction (e.g., PCA).
# c. Create a heatmap to illustrate the clustering results.

# Where K0 = 2
agg = AgglomerativeClustering(n_clusters=K0, linkage='single')
hierarchical_labels = agg.fit_predict(df_scaled)

plt.figure(figsize=(10, 6))
plt.scatter(df_pca[:, 0], df_pca[:, 1], c=hierarchical_labels, cmap='viridis')
plt.xlabel('PCA1')
plt.ylabel('PCA2')
plt.title('Hierarchical Clustering')
plt.show()

df_clustered['Cluster'] = hierarchical_labels
cluster_means = df_clustered.groupby('Cluster').mean()

plt.figure(figsize=(10, 8))
sns.heatmap(cluster_means, cmap='viridis', annot=True)
plt.title('Hierarchical Clustering Heatmap (Cluster Means)')
plt.show()

# 5. Comparison:
# Briefly compare the clustering results of K-means, DBSCAN, hierarchical clustering with the
# real (natural) clusters in terms of:
#  Cluster distribution
#  Cluster sizes
#  Visualization patterns

results_df = pd.DataFrame({
    'true_cluster': true_labels,
    'kmeans_cluster': kmeans_labels,
    'dbscan_cluster': dbscan_labels,
    'hierarchical_cluster': hierarchical_labels
})

print("\nCluster Sizes:")
print("\nTrue clusters:")
print(Counter(results_df['true_cluster']))
print("\nK-means clusters:")
print(Counter(results_df['kmeans_cluster']))
print("\nDBSCAN clusters:")
print(Counter(results_df['dbscan_cluster']))
print("\nHierarchical clusters:")
print(Counter(results_df['hierarchical_cluster']))

fig, axes = plt.subplots(2, 2, figsize=(15, 15))

axes[0, 0].scatter(df_pca[:, 0], df_pca[:, 1], c=results_df['true_cluster'], cmap='viridis')
axes[0, 0].set_title('True Clusters')

axes[0, 1].scatter(df_pca[:, 0], df_pca[:, 1], c=results_df['kmeans_cluster'], cmap='viridis')
axes[0, 1].set_title('K-means Clusters')

axes[1, 0].scatter(df_pca[:, 0], df_pca[:, 1], c=results_df['dbscan_cluster'], cmap='viridis')
axes[1, 0].set_title('DBSCAN Clusters')

axes[1, 1].scatter(df_pca[:, 0], df_pca[:, 1], c=results_df['hierarchical_cluster'], cmap='viridis')
axes[1, 1].set_title('Hierarchical Clusters')

plt.tight_layout()
plt.show()

print("\nAdjusted Rand Index (comparison with true clusters):")
print("K-means:", adjusted_rand_score(results_df['true_cluster'], results_df['kmeans_cluster']))
print("DBSCAN:", adjusted_rand_score(results_df['true_cluster'], results_df['dbscan_cluster']))
print("Hierarchical:", adjusted_rand_score(results_df['true_cluster'], results_df['hierarchical_cluster']))

print("\nSilhouette Scores:")
print("K-means:", silhouette_score(df_scaled, results_df['kmeans_cluster']))
print("DBSCAN:", silhouette_score(df_scaled, results_df['dbscan_cluster']))
print("Hierarchical:", silhouette_score(df_scaled, results_df['hierarchical_cluster']))